Columns we need from purordmain

ordcode as order code
orddt as Order Date
SCHEME_DOCNO as PO Number
ADMSITE_CODE

DTFR as Delivery Frpm
DTTO as Last Delivery Date

columns we need from purorddet

ordcode is in purordmain and purorddet so can make relationship

icode as Icode
ordqty as Quantity Ordered
cnlqty as Cancelled Quantity


purorddet & V_item have icode in common

so we need these columns from V_item

PARTYNAME as Vendor
lev1grpname as division
lev2grpname as section
GRPNAME as Department
cname1 as Cat1
cname2 as Cat2
cname3 as cat3
cname4 as cat4
cname5 as cat5
cname6 as cat6
desc6 as MRP
desc1 as Design
desc2
desc3 as Fabric
UDFSTRING01
UDFSTRING02
UDFSTRING03
UDFSTRING04
UDFSTRING05
UDFSTRING06
UDFSTRING07
UDFSTRING08
UDFSTRING09
UDFSTRING10

