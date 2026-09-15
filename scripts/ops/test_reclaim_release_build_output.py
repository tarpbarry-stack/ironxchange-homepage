import importlib.util
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('cleanup', Path(__file__).with_name('reclaim-release-build-output.py'))
cleanup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cleanup)

class CleanupSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.old = {name: getattr(cleanup, name) for name in ['APP', 'DATABASE', 'RELEASES', 'LEGACY', 'CACHES']}
        cleanup.APP = self.root / 'app'
        cleanup.APP.mkdir()
        cleanup.DATABASE = self.root / 'live.sqlite'
        cleanup.DATABASE.write_bytes(b'LIVE DATABASE MUST SURVIVE')
        cleanup.RELEASES = self.root / 'releases'
        cleanup.RELEASES.mkdir()
        cleanup.LEGACY = [self.root / 'legacy']
        cleanup.CACHES = [self.root / 'cache']
        self.backup = cleanup.LEGACY[0]
        self.backup.mkdir()
        (self.backup / 'old.sqlite').write_bytes(b'old unique database\x00' * 20000)
        (self.backup / 'passports.json').write_text('[{"passportId":"OLD-RECORD"}]')

    def tearDown(self):
        for name, value in self.old.items(): setattr(cleanup, name, value)
        self.temp.cleanup()

    def test_live_database_and_application_are_never_targets(self):
        for target in [cleanup.APP, cleanup.DATABASE, cleanup.APP / 'node_modules', cleanup.APP / 'passport/passports.json', cleanup.RELEASES, cleanup.RELEASES / 'latest-recovery.json']:
            with self.assertRaises(RuntimeError): cleanup.require_target(target)

    def test_application_backup_root_is_selected_once(self):
        nested = cleanup.APP / 'backups'
        nested.mkdir()
        cleanup.LEGACY.append(nested)
        with patch.object(Path, 'glob', return_value=[]):
            archived, caches = cleanup.discover()
        self.assertEqual(archived.count(nested), 1)

    def test_symlink_target_is_refused(self):
        cache = cleanup.CACHES[0]
        cache.symlink_to(cleanup.APP, target_is_directory=True)
        with self.assertRaises(RuntimeError): cleanup.require_target(cache)

    def test_redirected_parent_is_refused(self):
        real = self.root / 'real'
        real.mkdir()
        (real / 'backup').mkdir()
        redirect = self.root / 'redirect'
        redirect.symlink_to(real, target_is_directory=True)
        cleanup.LEGACY = [redirect / 'backup']
        with self.assertRaises(RuntimeError): cleanup.require_target(cleanup.LEGACY[0])

    def test_archive_preserves_database_passports_and_symlinks(self):
        (self.backup / 'link').symlink_to('passports.json')
        records = cleanup.inventory([self.backup])
        bundle = self.root / 'archive.tar.gz'
        cleanup.pack_and_verify(bundle, records)
        with tarfile.open(bundle) as archive:
            names = archive.getnames()
            self.assertIn(str(self.backup / 'old.sqlite').lstrip('/'), names)
            self.assertEqual(archive.extractfile(str(self.backup / 'old.sqlite').lstrip('/')).read(), (self.backup / 'old.sqlite').read_bytes())
        with patch.object(cleanup, 'require_inactive'):
            cleanup.remove_targets([self.backup], records)
        self.assertFalse(self.backup.exists())
        self.assertEqual(cleanup.DATABASE.read_bytes(), b'LIVE DATABASE MUST SURVIVE')

    def test_changed_backup_blocks_deletion(self):
        records = cleanup.inventory([self.backup])
        (self.backup / 'passports.json').write_text('changed')
        with self.assertRaises(RuntimeError): cleanup.remove_targets([self.backup], records)
        self.assertTrue((self.backup / 'old.sqlite').exists())

    def test_new_file_blocks_deletion(self):
        records = cleanup.inventory([self.backup])
        (self.backup / 'new-data.json').write_text('{}')
        with self.assertRaises(RuntimeError): cleanup.remove_targets([self.backup], records)
        self.assertTrue(self.backup.exists())

    def test_in_use_directory_blocks_deletion(self):
        proc_root = self.root / 'limited-proc'
        process = proc_root / '987654'
        process.mkdir(parents=True)
        (process / 'fd').mkdir()
        (process / 'cwd').symlink_to(self.backup, target_is_directory=True)
        (process / 'cmdline').write_bytes(b'node\0worker.js\0')
        actual_users_of = cleanup.users_of
        with patch.object(cleanup, 'users_of', lambda roots: actual_users_of(roots, proc_root)):
            with self.assertRaises(RuntimeError): cleanup.remove_targets([self.backup])
        self.assertTrue(self.backup.exists())

    def test_missing_archive_content_rejected(self):
        records = cleanup.inventory([self.backup])
        bundle = self.root / 'empty.tar.gz'
        with tarfile.open(bundle, 'w:gz'): pass
        with self.assertRaises(RuntimeError): cleanup.verify_archive(bundle, records)

    def test_modified_archive_content_rejected(self):
        records = cleanup.inventory([self.backup])
        (self.backup / 'passports.json').write_text('tampered')
        with self.assertRaises(RuntimeError): cleanup.pack_and_verify(self.root / 'bad.tar.gz', records)

    def test_only_release_dependency_copies_are_excluded(self):
        release = cleanup.RELEASES / ('source-before-' + 'a' * 40 + '-20260915T230000Z')
        release.mkdir()
        modules = release / 'node_modules'
        modules.mkdir()
        (modules / 'generated.js').write_text('generated')
        (release / 'package-lock.json').write_text('{}')
        records = cleanup.inventory([release])
        self.assertFalse(any('node_modules' in key for key in records))
        legacy_modules = self.backup / 'node_modules'
        legacy_modules.mkdir()
        (legacy_modules / 'unknown.json').write_text('{"preserve":true}')
        records = cleanup.inventory([self.backup])
        self.assertTrue(any('unknown.json' in key for key in records))

    def test_hardlinked_backup_files_are_archived_as_full_files(self):
        import os
        os.link(self.backup / 'passports.json', self.backup / 'passport-copy.json')
        cleanup.pack_and_verify(self.root / 'hardlinks.tar.gz', cleanup.inventory([self.backup]))

if __name__ == '__main__': unittest.main()
