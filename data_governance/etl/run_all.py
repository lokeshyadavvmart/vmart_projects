import subprocess
import sys

PYTHON_EXE = sys.executable

# Run Python modules, NOT scripts
modules = [
    "etl.item_master.get_items",
    "etl.processes.color_variant",
    "etl.processes.duplicate_item",
    "etl.processes.same_style",
]

for module in modules:
    print(f"Running module {module}...")
    
    result = subprocess.run([PYTHON_EXE, "-m", module])

    if result.returncode != 0:
        print(f"❌ Failed: {module}")
        sys.exit(1)

    print(f"✅ Completed: {module}")

print("🎉 All ETL jobs completed successfully")