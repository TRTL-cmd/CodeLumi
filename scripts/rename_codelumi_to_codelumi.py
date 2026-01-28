#!/usr/bin/env python3
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

EXCLUDE_DIRS = {'.git', 'node_modules', 'dist', 'build', 'release', 'win-unpacked', '.venv', '__pycache__'}

def replace_case_insensitive(content):
    # Ordered replacements to avoid clashes
    # 1) KIRA_ -> CODELUMI_
    content = re.sub(r'\bKIRA_', 'CODELUMI_', content)
    # 2) kira_ -> codelumi_
    content = re.sub(r'\bkira_', 'codelumi_', content)
    # 3) KIRA (all-caps standalone)
    content = re.sub(r'\bKIRA\b', 'CODELUMI', content)

    # 4) Title-case Kira -> Codelumi (word boundary)
    content = re.sub(r'\bKira\b', 'Codelumi', content)

    # 5) lowercase standalone kira -> lumi (for variables, globals)
    content = re.sub(r'\bkira\b', 'lumi', content)

    # 6) generic substring replacement: replace any remaining 'kira' in words
    def sub_repl(m):
        s = m.group(0)
        if s.isupper():
            return 'CODELUMI'
        if s[0].isupper():
            return 'Codelumi'
        return 'codelumi'

    content = re.sub(r'(?i)kira', sub_repl, content)
    return content

def is_binary(path: Path):
    try:
        with open(path, 'rb') as f:
            chunk = f.read(1024)
            if b'\0' in chunk:
                return True
    except Exception:
        return True
    return False

def process_files():
    text_files = 0
    updated_files = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        # skip excluded dirs
        parts = Path(dirpath).parts
        if any(p in EXCLUDE_DIRS for p in parts):
            continue
        for fname in filenames:
            fpath = Path(dirpath) / fname
            # skip this script
            try:
                if fpath.samefile(Path(__file__)):
                    continue
            except Exception:
                pass
            if is_binary(fpath):
                continue
            try:
                text_files += 1
                text = fpath.read_text(encoding='utf-8', errors='replace')
                new = replace_case_insensitive(text)
                if new != text:
                    backup = fpath.with_suffix(fpath.suffix + '.bak')
                    if not backup.exists():
                        fpath.replace(backup)
                        backup.write_text(text, encoding='utf-8')
                        fpath.write_text(new, encoding='utf-8')
                    else:
                        fpath.write_text(new, encoding='utf-8')
                    updated_files += 1
                    print(f'Updated: {fpath}')
            except Exception as e:
                print(f'Error processing {fpath}: {e}')
    print(f'Processed {text_files} text files, updated {updated_files} files.')

def rename_paths():
    # Rename files and directories that contain 'kira' (case-insensitive)
    renamed = 0
    # Walk bottom-up so files are renamed before directories
    for dirpath, dirnames, filenames in os.walk(ROOT, topdown=False):
        parts = Path(dirpath).parts
        if any(p in EXCLUDE_DIRS for p in parts):
            continue
        for name in filenames:
            if re.search(r'(?i)kira', name):
                old = Path(dirpath) / name
                new_name = re.sub(r'(?i)kira', lambda m: 'codelumi' if m.group(0).islower() else ('CODELUMI' if m.group(0).isupper() else 'Codelumi'), name)
                new = Path(dirpath) / new_name
                try:
                    old.rename(new)
                    print(f'Renamed file: {old} -> {new}')
                    renamed += 1
                except Exception as e:
                    print(f'Failed to rename file {old}: {e}')
        for name in dirnames:
            if re.search(r'(?i)kira', name):
                old = Path(dirpath) / name
                new_name = re.sub(r'(?i)kira', lambda m: 'codelumi' if m.group(0).islower() else ('CODELUMI' if m.group(0).isupper() else 'Codelumi'), name)
                new = Path(dirpath) / new_name
                try:
                    old.rename(new)
                    print(f'Renamed dir: {old} -> {new}')
                    renamed += 1
                except Exception as e:
                    print(f'Failed to rename dir {old}: {e}')
    print(f'Renamed {renamed} paths.')

def main():
    print(f'Running rename from {ROOT}')
    process_files()
    rename_paths()

if __name__ == '__main__':
    main()
