import zipfile
import os

zip_name = "gridlock_source_code.zip"
exclude_dirs = {
    ".venv", "node_modules", ".next", ".git", "__pycache__", 
    ".idea", ".vscode", "temp", "tmp", ".gemini"
}
exclude_files = {
    zip_name, "gridlock_source_code.zip", ".DS_Store", "Thumbs.db"
}

print(f"=== PACKAGING PROJECT FOR SUBMISSION ===")
print(f"Creating archive: {zip_name}...")

count = 0
with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        # Prune excluded directories in-place so os.walk doesn't descend into them
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if file in exclude_files:
                continue
                
            file_path = os.path.join(root, file)
            # Relative path from the root of the workspace
            archive_name = os.path.relpath(file_path, '.')
            
            # Skip virtual env or package folders if missed by dir filtering
            if any(ex in archive_name.split(os.sep) for ex in exclude_dirs):
                continue
                
            zipf.write(file_path, archive_name)
            count += 1

print(f"\nSuccessfully packaged {count} files!")
print(f"File size: {os.path.getsize(zip_name) / (1024 * 1024):.2f} MB")
print(f"You can now upload '{zip_name}' directly to the Flipkart GRID portal!")
