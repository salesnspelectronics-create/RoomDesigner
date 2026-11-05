#!/usr/bin/env python3
"""Inventory Git blobs only; never execute product code, tests, or a build."""
import argparse
import json
import subprocess
from pathlib import PurePosixPath


def git(*args):
    return subprocess.check_output(['git', *args])


def category(path):
    if path.startswith('assets/vendor/'):
        return 'excluded_vendor'
    if path.startswith('tests/'):
        return 'test_source_static_only'
    if path.endswith('package-lock.json'):
        return 'generated_dependency_lock'
    if PurePosixPath(path).suffix.lower() in {'.js', '.cjs', '.mjs', '.html', '.css', '.json', '.py', '.yml', '.yaml', '.svg'}:
        return 'source_or_configuration'
    return 'reference_or_binary'


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--ref', default='HEAD', help='Pinned commit; ignored with --staged')
parser.add_argument('--staged', action='store_true', help='Inventory candidate index blobs')
args = parser.parse_args()
entries = []
raw = git('ls-files', '--stage', '-z') if args.staged else git('ls-tree', '-rz', args.ref)
for item in raw.split(b'\0'):
    if not item:
        continue
    header, name = item.split(b'\t', 1)
    path = name.decode('utf-8')
    # State files cannot include their own blob hashes. Policy is inventoried.
    if path in {'audit/regression/inventory.json', 'audit/regression/checkpoint.json'}:
        continue
    mode, kind_or_sha, sha_or_stage = header.decode().split()
    if args.staged:
        if sha_or_stage != '0':
            raise SystemExit('Unmerged index; inventory refused')
        sha = kind_or_sha
    else:
        if kind_or_sha != 'blob':
            continue
        sha = sha_or_stage
    payload = git('cat-file', 'blob', sha)
    binary = b'\0' in payload
    lines = None if binary else payload.count(b'\n') + int(bool(payload) and not payload.endswith(b'\n'))
    entries.append({'path': path, 'blob_sha': sha, 'mode': mode, 'bytes': len(payload),
                    'lines': lines, 'category': category(path), 'binary': binary})
print(json.dumps({'format': 1, 'repository': 'salesnspelectronics-create/RoomDesigner',
                  'branch': 'main', 'order': 'path Unicode code-point ascending',
                  'entries': sorted(entries, key=lambda row: row['path'])}, indent=2, ensure_ascii=False))
