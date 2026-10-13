import csv,json,re,collections
cat={r['id']:r['description'] for r in csv.DictReader(open('food_category.csv'))}
mu={r['id']:r['name'] for r in csv.DictReader(open('measure_unit.csv'))}
F={r['fdc_id']:r for r in csv.DictReader(open('food.csv'))}
NID={'1008':0,'1003':1,'1005':2,'1004':3,'1079':4,'2000':5,'1093':6,'1258':7,'1253':8}
N=collections.defaultdict(lambda:[None]*9)
for r in csv.DictReader(open('food_nutrient.csv')):
  i=NID.get(r['nutrient_id'])
  if i is not None and r['amount']!='':N[r['fdc_id']][i]=float(r['amount'])
P=collections.defaultdict(list)
for r in csv.DictReader(open('food_portion.csv')):
  try:g=float(r['gram_weight']);a=float(r['amount'] or 1)
  except:continue
  u=mu.get(r['measure_unit_id'],'');u='' if u=='undetermined' else u
  lab=' '.join(x for x in [('%g'%a),u,r['portion_description'],r['modifier']] if x).strip()
  lab=re.sub(r'\s+',' ',lab)
  P[r['fdc_id']].append((int(r['seq_num'] or 99),lab[:40],round(g,1)))
DROPC={'Baby Foods','American Indian/Alaska Native Foods'}
BAD=re.compile(r'industrial|commercial formulation|school lunch|infant|USDA Commodity|babyfood|freeze-dried|separable fat|by-products|variety meats|frozen, unprepared|dry mix|ns as to|not further|Formulated bar|Leavening|imported|unprepared|Game meat|Mollusks|Crustaceans, crayfish|Fish, (?!salmon|tuna|cod|tilapia|catfish|haddock|pollock|sardine|trout|halibut|mackerel)|Beef, (?!ground|top sirloin|sirloin|ribeye|rib eye|brisket|flank|chuck|round|tenderloin|t-bone)|Lamb|Veal|Pork, fresh, (?!loin|ground|shoulder|spareribs)|Turkey, (?!ground|breast|whole)|raw(?!.*(fruit|vegetable))',re.I)
out=[]
for fid,f in F.items():
  c=cat.get(f['food_category_id'],'');d=f['description']
  n=N.get(fid)
  if not n or n[0] is None or c in DROPC:continue
  fast=c in('Fast Foods','Restaurant Foods')
  if not fast and BAD.search(d):
    # allow raw fruit/vegetables
    if not (re.search(r', raw\b',d) and c in('Fruits and Fruit Juices','Vegetables and Vegetable Products','Nut and Seed Products')):continue
  if c=='Meals, Entrees, and Side Dishes' and False:pass
  name=re.sub(r',? with added (nonfat milk solids and )?vitamin A( and vitamin D)?| and vitamin D|, fluid|, enriched|, regular|, commercially prepared|, composite of trimmed retail cuts|, meat only|broilers or fryers, |, all commercial varieties|, includes USDA commodity','',d).replace('  ',' ')
  pp=[(l,g) for _,l,g in sorted(P.get(fid,[]))][:4]
  out.append((fast,min(len(name),70),[int(fid),name,c]+[None if v is None else round(v,1) for v in n]+[pp]))
seen=set();o2=[]
for o in out:
  k=o[2][1].lower()
  if k in seen:continue
  seen.add(k);o2.append(o)
out=o2
fast=[o for o in out if o[0]];COM=re.compile(r'^(Chicken|Beef, ground|Rice|Bread|Milk|Egg|Cheese|Yogurt|Pasta|Spaghetti|Apples|Bananas|Oranges|Grapes|Strawberries|Blueberries|Broccoli|Carrots|Potatoes|Sweet potato|Spinach|Lettuce|Tomatoes|Beans|Peanut butter|Oats|Cereals|Salmon|Fish, tuna|Turkey|Pork|Bacon|Sausage|Tortillas|Avocados|Onions|Peppers|Butter|Oil|Cream|Ice cream|Cookies|Crackers|Snacks|Soup|Pizza|Sandwich|Juice|Coffee|Tea|Soda|Beverages|Nuts|Almonds|Corn|Peas|Squash|Cucumber|Celery|Mushrooms|Fish|Shrimp|Tofu|Hummus|Granola|Bagels|Muffins|Pancakes|Waffles|Popcorn|Chips|Candies|Chocolate|Lentils|Chickpeas|Quinoa|Couscous|Melons|Watermelon|Pineapple|Mangos|Peaches|Pears|Cherries|Raspberries|Kale|Cabbage|Cauliflower|Zucchini|Garlic|Honey|Jams|Syrups|Sugars|Mayonnaise|Ketchup|Mustard|Salad dressing|Sauce|Gravy|Frankfurter|Ham|Bologna|Hot dog)',re.I)
rest=sorted([o for o in out if not o[0]],key=lambda o:(not o[2][-1],o[1]-(45 if COM.search(o[2][1]) else 0)-(15 if re.search(r'cooked|raw|prepared|roasted|baked|boiled|grilled',o[2][1]) else 0)))
sel=[o[2] for o in fast]+[o[2] for o in rest][:2000-len(fast)]
print(len(out),len(fast),len(sel))
C=sorted(set(s[2] for s in sel));
for s in sel:s[2]=C.index(s[2])
json.dump({'v':'SR Legacy 2018-04','cats':C,'f':sel},open('/workspace/usda/usda-foods.json','w'),separators=(',',':'))
