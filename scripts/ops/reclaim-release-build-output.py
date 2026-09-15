#!/usr/bin/env python3
"""Retire audited IX-Core backup/build material after verified private recovery."""
import argparse
import fcntl
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import stat
import subprocess
import tarfile
import tempfile
import time
from datetime import datetime, timezone

APP = Path('/var/www/ix-core')
DATABASE = Path('/var/lib/ixi-core/mos/ixi-aos.sqlite')
RELEASES = Path('/var/backups/ixi-core-releases')
EXPECTED_COMMIT = '65590546489cf47a9320a90b50ac3a5430fef8cc'
BUCKET = 'ixi-core-recovery-459212966383-us-east-2'
ACCOUNT = '459212966383'
LEGACY = [Path('/var/backups/ixi-core-equipment'), APP / 'backups', DATABASE.parent / 'backups']
CACHES = [Path(p) for p in ['/home/ubuntu/.cache/yarn', '/home/ubuntu/.cache/node-gyp',
    '/home/ubuntu/.npm/_cacache', '/root/.npm/_cacache', '/root/.cache/node-gyp']]
SOURCE_PATTERN = re.compile(r'source-before-[a-f0-9]{40}-[0-9]{8}T[0-9]{6}Z')
STAGE_PATTERN = re.compile(r'ixi-complete-release-[A-Za-z0-9]{8}')

S3_UPLOAD = r'''
const fs=require('node:fs'),crypto=require('node:crypto');
const {S3Client,PutObjectCommand,GetObjectCommand,GetPublicAccessBlockCommand,GetBucketVersioningCommand}=require('/var/www/ix-core/node_modules/@aws-sdk/client-s3');
(async()=>{
 const input=JSON.parse(fs.readFileSync(0,'utf8'));
 const client=new S3Client({region:'us-east-2'});
 const common={Bucket:'ixi-core-recovery-459212966383-us-east-2',ExpectedBucketOwner:'459212966383'};
 const block=(await client.send(new GetPublicAccessBlockCommand(common))).PublicAccessBlockConfiguration;
 if(!block || !['BlockPublicAcls','IgnorePublicAcls','BlockPublicPolicy','RestrictPublicBuckets'].every(k=>block[k]===true))throw Error('Archive bucket is not private');
 if((await client.send(new GetBucketVersioningCommand(common))).Status!=='Enabled')throw Error('Archive bucket is not versioned');
 const put=await client.send(new PutObjectCommand({...common,Key:input.key,Body:fs.createReadStream(input.file),ContentLength:fs.statSync(input.file).size,ContentType:'application/gzip',ServerSideEncryption:'AES256',Metadata:{sha256:input.sha256,purpose:'retired-local-backups'},IfNoneMatch:'*'}));
 if(!put.VersionId)throw Error('Archive upload has no immutable version');
 const get=await client.send(new GetObjectCommand({...common,Key:input.key,VersionId:put.VersionId}));
 const hash=crypto.createHash('sha256');let bytes=0;
 for await(const chunk of get.Body){hash.update(chunk);bytes+=chunk.length;}
 if(hash.digest('hex')!==input.sha256 || bytes!==fs.statSync(input.file).size)throw Error('Archive readback differs from local verified archive');
 process.stdout.write(JSON.stringify({ok:true,bucket:common.Bucket,key:input.key,versionId:put.VersionId,sha256:input.sha256,bytes,downloadVerified:true}));
})().catch(e=>{process.stderr.write(e.message+'\n');process.exitCode=1;});
'''


def emit(value):
    print(json.dumps(value, sort_keys=True), flush=True)


def digest_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def checked_path(path):
    path = Path(path)
    if path.is_symlink() or path.resolve() != path or not path.exists():
        raise RuntimeError('Path is missing, redirected, or a symlink: ' + str(path))
    if not path.is_dir() and not path.is_file():
        raise RuntimeError('Unsupported cleanup path: ' + str(path))
    if path.stat().st_dev != APP.stat().st_dev:
        raise RuntimeError('Cleanup target crosses a filesystem: ' + str(path))
    return path


def allowed(path):
    path = Path(path)
    if path in LEGACY or path in CACHES:
        return True
    if path.parent == RELEASES:
        return bool(SOURCE_PATTERN.fullmatch(path.name) or path.suffix == '.tgz' or
            path.name in ['build3-cleanup-20260907-051215', 'passports-20260907-024859.json',
                'broken-one-record-passports-20260907-0415.json', 'pre-test-tenant-purge-passports-20260907-034513.json'])
    if path.parent == Path('/var/tmp'):
        return bool(STAGE_PATTERN.fullmatch(path.name))
    if path.parent == APP:
        return any(path.name.startswith(prefix) for prefix in
            ['index.js.before-', 'index.js.bak-', 'index.js.backup-', '.env.before-'])
    return False


def require_target(path):
    if not allowed(path):
        raise RuntimeError('Target is outside the audited allowlist: ' + str(path))
    return checked_path(path)


def users_of(roots, proc_root=Path('/proc')):
    values = [str(root) for root in roots]
    busy = set()
    for process in proc_root.iterdir():
        if not process.name.isdigit() or int(process.name) == os.getpid():
            continue
        try:
            links = [process / 'cwd', process / 'exe'] + list((process / 'fd').iterdir())
            for link in links:
                try:
                    target = os.readlink(link)
                    if any(target == root or target.startswith(root + '/') for root in values):
                        busy.add(int(process.name))
                except (FileNotFoundError, ProcessLookupError):
                    pass
            command = (process / 'cmdline').read_bytes()
            if any(root.encode() in command for root in values):
                busy.add(int(process.name))
        except (FileNotFoundError, ProcessLookupError):
            pass
    return sorted(busy)


def require_inactive(roots):
    busy = users_of(roots)
    if busy:
        raise RuntimeError('Cleanup targets are in use by process IDs: ' + str(busy))
    # Package caches may be used without an open file at the inspection instant.
    for process in Path('/proc').iterdir():
        if not process.name.isdigit() or int(process.name) == os.getpid():
            continue
        try:
            name = (process / 'comm').read_text().strip()
            if name in {'npm', 'yarn', 'pnpm', 'node-gyp', 'apt', 'apt-get', 'dpkg'}:
                raise RuntimeError('Package operation is active: ' + name)
        except (FileNotFoundError, ProcessLookupError):
            pass


def discover():
    archived = []
    for path in sorted(RELEASES.iterdir()):
        if not allowed(path):
            continue
        require_target(path)
        if SOURCE_PATTERN.fullmatch(path.name):
            for name in ['rollback.json', 'recovery-receipt.json', 'package.json', 'package-lock.json']:
                if not (path / name).is_file():
                    raise RuntimeError('Incomplete source rollback set: ' + str(path))
            receipt = json.loads((path / 'recovery-receipt.json').read_text())
            if not receipt.get('ok') or not receipt.get('versionId'):
                raise RuntimeError('Rollback set has no successful recovery receipt: ' + str(path))
        archived.append(path)
    for path in LEGACY:
        if path.exists():
            archived.append(require_target(path))
    for path in sorted(Path('/var/tmp').glob('ixi-complete-release-*')):
        require_target(path)
        manifest = json.loads((path / 'release.json').read_text())
        if manifest.get('schema') != 'ixi.runtime-release.v1' or not re.fullmatch('[a-f0-9]{40}', manifest.get('commit', '')):
            raise RuntimeError('Unknown staged release: ' + str(path))
        if not (path / 'package-lock.json').is_file():
            raise RuntimeError('Staged release lacks reproducible dependencies')
        archived.append(path)
    for path in APP.iterdir():
        if path.is_file() and allowed(path):
            archived.append(require_target(path))
    caches = [require_target(path) for path in CACHES if path.exists()]
    if len(set(archived)) != len(archived):
        raise RuntimeError('Duplicate archive targets')
    return archived, caches


def excluded(path, root):
    # Only generated top-level dependencies from checked release copies are omitted.
    return path.parent == root and path.name in {'node_modules', 'failed-node_modules'} and (
        SOURCE_PATTERN.fullmatch(root.name) or STAGE_PATTERN.fullmatch(root.name))


def inventory(roots):
    records = {}
    def visit(path, root):
        if excluded(path, root):
            if path.is_symlink() or not path.is_dir():
                raise RuntimeError('Generated dependencies must be a plain directory')
            return
        st = path.lstat()
        if st.st_dev != root.stat().st_dev:
            raise RuntimeError('Archive crosses a filesystem: ' + str(path))
        relative = str(path).lstrip('/')
        record = {'size': st.st_size, 'mtime_ns': st.st_mtime_ns, 'mode': stat.S_IMODE(st.st_mode),
            'device': st.st_dev, 'inode': st.st_ino}
        if stat.S_ISLNK(st.st_mode):
            record.update(type='symlink', target=os.readlink(path))
        elif stat.S_ISREG(st.st_mode):
            record.update(type='file', sha256=digest_file(path))
        elif stat.S_ISDIR(st.st_mode):
            record.update(type='directory')
        else:
            raise RuntimeError('Unexpected special file in retired backup: ' + str(path))
        records[relative] = record
        if record['type'] == 'directory':
            for child in sorted(path.iterdir()):
                visit(child, root)
    for root in roots:
        require_target(root)
        visit(root, root)
    return records


def pack_and_verify(bundle, records):
    with tarfile.open(bundle, 'w:gz', compresslevel=1, dereference=False) as archive:
        payload = json.dumps(records, sort_keys=True).encode()
        info = tarfile.TarInfo('IXI-CLEANUP-MANIFEST.json')
        info.size = len(payload)
        info.mode = 0o600
        archive.addfile(info, io.BytesIO(payload))
        for relative in records:
            archive.inodes.clear()
            archive.add('/' + relative, arcname=relative, recursive=False)
    verify_archive(bundle, records)


def verify_archive(bundle, records):
    observed = set()
    with tarfile.open(bundle, 'r|gz') as archive:
        for member in archive:
            if member.name == 'IXI-CLEANUP-MANIFEST.json':
                if json.load(archive.extractfile(member)) != records:
                    raise RuntimeError('Archive manifest mismatch')
                continue
            if member.name not in records or member.name in observed:
                raise RuntimeError('Unexpected or repeated archive member')
            observed.add(member.name)
            expected = records[member.name]
            if member.isfile() and expected['type'] == 'file':
                h = hashlib.sha256()
                stream = archive.extractfile(member)
                for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                    h.update(chunk)
                if h.hexdigest() != expected['sha256']:
                    raise RuntimeError('Archive content mismatch: ' + member.name)
            elif member.issym() and expected['type'] == 'symlink':
                if member.linkname != expected['target']:
                    raise RuntimeError('Archive symlink mismatch')
            elif not (member.isdir() and expected['type'] == 'directory'):
                raise RuntimeError('Archive member type mismatch')
    if observed != set(records):
        raise RuntimeError('Archive is missing retired backup content')


def remove_targets(roots, archived_records=None):
    if archived_records is not None and inventory(roots) != archived_records:
        raise RuntimeError('Retired material changed after archive verification; nothing in this set deleted')
    require_inactive(roots)
    for path in roots:
        require_target(path)
        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink()


def run(args, **kwargs):
    return subprocess.run(args, check=True, text=True, capture_output=True, **kwargs).stdout


def health():
    return {route: json.loads(run(['curl', '--max-time', '8', '-fsS', 'http://127.0.0.1:4100/' + route], timeout=10))
        for route in ['live', 'ready']}


def source_proof():
    proof = json.loads(run(['node', str(APP / 'ops/runtime-release.js'), 'verify', str(APP), str(APP / '.ixi-release.json')], timeout=30))
    if not proof['ok'] or proof['commit'] != EXPECTED_COMMIT:
        raise RuntimeError('Live release differs from the audited cleanup target')
    return proof


def processes():
    values = json.loads(run(['sudo', '-u', 'ubuntu', '-H', 'pm2', 'jlist'], timeout=20))
    return {p['name']: {'pid': p['pid'], 'status': p['pm2_env']['status'],
        'restarts': p['pm2_env'].get('restart_time')} for p in values}


def data_proof():
    db = sqlite3.connect('file:' + str(DATABASE) + '?mode=ro', uri=True, timeout=2)
    try:
        db.execute('PRAGMA query_only=ON')
        rows = db.execute('SELECT collection_key,payload,payload_sha256 FROM mos_collections').fetchall()
        hashes = {}
        counts = {}
        for name, payload, expected in rows:
            actual = hashlib.sha256(payload.encode()).hexdigest()
            if actual != expected:
                raise RuntimeError('Live collection checksum mismatch: ' + name)
            hashes[name] = actual
            if name in ['objects.json', 'relationships.json']:
                counts[name] = len(json.loads(payload))
    finally:
        db.close()
    passport = APP / 'passport/passports.json'
    passport_bytes = passport.read_bytes()
    passports = json.loads(passport_bytes)
    ids = [p['passportId'] for p in passports]
    if len(ids) != len(set(ids)):
        raise RuntimeError('Duplicate Passport IDs')
    return {'collections': hashes, 'counts': counts, 'passportCount': len(ids),
        'passportSha256': hashlib.sha256(passport_bytes).hexdigest(), 'databaseInode': DATABASE.stat().st_ino}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise RuntimeError('Maintenance must run as root through the authorized workflow')
    with open('/var/lock/ixi-core-production.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        source = source_proof()
        health()
        before_processes = processes()
        if any(before_processes.get(name, {}).get('status') != 'online' for name in ['IX-Core', 'IXI-Media-Worker', 'Ironxchange']):
            raise RuntimeError('Expected live services must be online before cleanup')
        archived, caches = discover()
        require_inactive(archived + caches)
        sizes = {str(p): int(run(['du', '-sx', '-B1', str(p)], timeout=30).split()[0]) for p in archived + caches}
        before = shutil.disk_usage('/').free
        emit({'phase': 'plan', 'apply': args.apply, 'availableBefore': before, 'candidateBytes': sum(sizes.values()),
            'archiveTargetCount': len(archived), 'cacheTargetCount': len(caches), 'sizes': sizes})
        if not args.apply:
            return
        # The fresh snapshot must fit BEFORE deleting any backup.
        if before < DATABASE.stat().st_size + 768 * 1024 * 1024:
            raise RuntimeError('Insufficient working space for a fresh verified recovery checkpoint')
        environment = dict(os.environ, AWS_REGION='us-east-2', IXI_RECOVERY_BUCKET=BUCKET,
            IXI_RECOVERY_ACCOUNT_ID=ACCOUNT, IXI_LIVE_ROOT=str(APP), IXI_MOS_SQLITE_PATH=str(DATABASE))
        emit({'phase': 'fresh-current-recovery-started'})
        receipt = json.loads(run(['node', str(APP / 'ops/backup-to-s3.js')], env=environment, timeout=900))
        if not receipt.get('ok') or not receipt.get('versionId'):
            raise RuntimeError('Fresh current recovery did not verify')
        emit({'phase': 'fresh-current-recovery-verified', **{k: receipt[k] for k in ['bucket', 'key', 'versionId', 'sha256', 'createdAt']}})
        run_id = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        evidence = RELEASES / ('capacity-cleanup-' + run_id)
        evidence.mkdir(mode=0o700)
        (evidence / 'current-recovery.json').write_text(json.dumps(receipt, indent=2))
        before_data = data_proof()
        (evidence / 'before-data.json').write_text(json.dumps(before_data, indent=2))
        # Remove only proven inactive regenerable caches to increase archive headroom.
        remove_targets(caches)
        emit({'phase': 'caches-removed', 'availableBytes': shutil.disk_usage('/').free})
        records = inventory(archived)
        bundle = evidence / 'retired-local-backups.tar.gz'
        emit({'phase': 'archive-started', 'filesAndDirectories': len(records)})
        pack_and_verify(bundle, records)
        sha = digest_file(bundle)
        key = 'recovery/retired-local-backups/' + run_id + '-' + sha[:12] + '.tar.gz'
        archive_receipt = json.loads(run(['node', '-e', S3_UPLOAD],
            input=json.dumps({'file': str(bundle), 'key': key, 'sha256': sha}), env=environment, timeout=600))
        (evidence / 'archive-receipt.json').write_text(json.dumps(archive_receipt, indent=2))
        (evidence / 'retired-manifest.json').write_text(json.dumps(records, indent=2))
        emit({'phase': 'retired-archive-verified', **archive_receipt})
        source_proof()
        remove_targets(archived, records)
        bundle.unlink()
        after_data = data_proof()
        after_processes = processes()
        changed = [key for key in before_data['collections'] if before_data['collections'][key] != after_data['collections'].get(key)]
        stable_keys = ['objects.json', 'relationships.json', 'entities.json']
        unchanged = all(key not in changed for key in stable_keys) and before_data['passportSha256'] == after_data['passportSha256']
        result = {'ok': True, 'phase': 'cleanup-complete', 'availableBefore': before,
            'availableAfter': shutil.disk_usage('/').free, 'reclaimedBytes': shutil.disk_usage('/').free - before,
            'removedTargets': [str(p) for p in archived + caches], 'source': source_proof(),
            'health': health(), 'processesUnchanged': before_processes == after_processes,
            'canonicalCollectionsAndPassportsUnchanged': unchanged, 'collectionsChangedDuringMaintenance': changed,
            'databaseFileUnchanged': before_data['databaseInode'] == after_data['databaseInode'],
            'beforeCounts': before_data['counts'], 'afterCounts': after_data['counts'],
            'beforePassports': before_data['passportCount'], 'afterPassports': after_data['passportCount'],
            'archive': archive_receipt, 'currentRecovery': {k: receipt[k] for k in ['bucket', 'key', 'versionId', 'sha256']}}
        (evidence / 'result.json').write_text(json.dumps(result, indent=2))
        emit({k: v for k, v in result.items() if k != 'removedTargets'})
        if not unchanged or before_processes != after_processes or not result['databaseFileUnchanged']:
            raise RuntimeError('Concurrent runtime/data change requires review of the retained evidence')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        emit({'ok': False, 'error': str(error), 'type': type(error).__name__})
        if isinstance(error, subprocess.CalledProcessError):
            print(error.stderr[-5000:] if error.stderr else '', flush=True)
        raise SystemExit(1)
