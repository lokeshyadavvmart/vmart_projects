import pandas as pd

# INPUT FILES
mrp_file = "mrp.xlsx"
sites_file = "sites.xlsx"

# OUTPUT FILE
output_file = "output.xlsx"

# Read files
mrp_df = pd.read_excel(mrp_file)
sites_df = pd.read_excel(sites_file)

# Rename columns
mrp_df = mrp_df.rename(columns={
    "ICODE_BARCODE": "icode_barcode",
    "LISTED_MRP": "listed_mrp",
    "OLD MRP": "old_mrp"
})

sites_df = sites_df.rename(columns={
    "SITE_SHORT_NAME": "site_short_name"
})

# CROSS JOIN (icode × sites)
cross_df = mrp_df.merge(sites_df, how="cross")

# Convert OLD and LISTED MRP into rows
stacked = cross_df.melt(
    id_vars=["icode_barcode", "site_short_name"],
    value_vars=["old_mrp", "listed_mrp"],
    value_name="MRP"
)

# Keep correct order (old first then listed)
stacked["order"] = stacked["variable"].map({
    "old_mrp": 0,
    "listed_mrp": 1
})

# Sort to keep rows together
stacked = stacked.sort_values(
    ["icode_barcode", "site_short_name", "order"]
)

# Create RSP
stacked["RSP"] = stacked["MRP"]

# Final columns
final_df = stacked[["icode_barcode", "site_short_name", "MRP", "RSP"]]

# Save output
final_df.to_excel(output_file, index=False)

print("Output generated:", output_file)
print("Total rows:", len(final_df))