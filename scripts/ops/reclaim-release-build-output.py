#!/usr/bin/env python3
"""One-time recovery of regenerable build output identified by the disk audit."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import time

CHECKOUT = Path('/tmp/ixi-aos-rollout-frontend')
FAILED_STAGE = Path('/var/tmp/ixi-complete-release-uSMXFJqE')
FAILED_COMMIT = '65590546489cf47a9320a90b50ac3a5430fef8cc'
DATABASE = Path('/var/lib/ixi-core/mos/ixi-aos.sqlite')


def require_plain_directory(path):
    if path.is_symlink() or not path.is_dir() or path.resolve() != path:
        raise RuntimeError(f'Expected a plain directory at {path}')


def users_of(root):
    prefix = str(root) + '/'
    busy = set()
    for process in Path('/proc').iterdir():
        if not process.name.isdigit() or int(process.name) == os.getpid():
            continue
        try:
            links = [process / 'cwd', process / 'exe'] + list((process / 'fd').iterdir())
            for link in links:
                try:
                    target = os.readlink(link)
                    if target == str(root) or target.startswith(prefix):
                        busy.add(int(process.name))
                except FileNotFoundError:
                    continue
            command = (process / 'cmdline').read_bytes()
            if str(root).encode() in command:
                busy.add(int(process.name))
        except (FileNotFoundError, ProcessLookupError):
            continue
    return sorted(busy)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    targets = []
    if CHECKOUT.exists():
        require_plain_directory(CHECKOUT)
        package = json.loads((CHECKOUT / 'package.json').read_text())
        lock = json.loads((CHECKOUT / 'package-lock.json').read_text())
        if not package.get('dependencies', {}).get('next') or not lock.get('lockfileVersion'):
            raise RuntimeError('Temporary checkout is not the expected reproducible Next.js build')
        if not (CHECKOUT / 'pages/aos/work.js').is_file():
            raise RuntimeError('Temporary checkout is missing its expected AOS source')
        for name in ['.next', 'node_modules']:
            path = CHECKOUT / name
            if not path.exists():
                continue
            require_plain_directory(path)
            if time.time() - path.stat().st_mtime < 1800:
                raise RuntimeError(f'Build output was modified recently: {path}')
            targets.append((CHECKOUT, path))
    if FAILED_STAGE.exists():
        require_plain_directory(FAILED_STAGE)
        manifest = json.loads((FAILED_STAGE / 'release.json').read_text())
        if manifest.get('commit') != FAILED_COMMIT:
            raise RuntimeError('Failed stage does not match the audited failed release')
        if (FAILED_STAGE / 'rollback.json').exists():
            raise RuntimeError('Refusing to remove a rollback set')
        targets.append((FAILED_STAGE, FAILED_STAGE))
    for root in {root for root, _ in targets}:
        busy = users_of(root)
        if busy:
            raise RuntimeError(f'Build files are in use by processes {busy}: {root}')
    before = shutil.disk_usage('/').free
    sizes = {str(path): int(subprocess.check_output(['du', '-sx', '-B1', str(path)], text=True).split()[0]) for _, path in targets}
    print(json.dumps({'apply': args.apply, 'availableBefore': before, 'regenerableTargets': sizes}), flush=True)
    if not args.apply:
        return
    for root, path in targets:
        require_plain_directory(path)
        if users_of(root):
            raise RuntimeError(f'Build files became active: {root}')
        shutil.rmtree(path)
    after = shutil.disk_usage('/').free
    required = DATABASE.stat().st_size + 768 * 1024 * 1024
    print(json.dumps({'availableAfter': after, 'reclaimedBytes': after - before, 'requiredForRetry': required, 'readyForRetry': after >= required}), flush=True)
    if after < required:
        raise RuntimeError('More capacity is required before another recovery snapshot')


if __name__ == '__main__':
    main()
