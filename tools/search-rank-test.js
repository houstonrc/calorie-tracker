// Run: node tools/search-rank-test.js  (checks the food search ranking rules in js/searchrank.js)
const R=require("../js/searchrank.js"),assert=require("assert");
const sr=n=>({src:"sr",name:n,per:{cal:100,p:5,c:20,f:1}});
const top=(list,q,ctx)=>R.rank(list,q,ctx)[0].name;
assert.equal(top(["Rice crackers","Rice bran, crude","Rice flour, brown","Rice, white, long-grain, cooked"].map(sr),"rice"),"Rice, white, long-grain, cooked");
assert.equal(top(["Melon, banana (Navajo)","Babyfood, banana no tapioca, strained","Bananas, raw"].map(sr),"banana"),"Bananas, raw");
assert.equal(top(["APPLEBEE'S, chili","Apples, raw, without skin"].map(sr),"apple"),"Apples, raw, without skin");
assert.equal(top(["Oil, oat","Bread, oat bran","Bagels, oat bran","Cereals, QUAKER, Quick Oats, Dry","Cereals, oats and quick, not fortified, dry"].map(sr),"oats"),"Cereals, oats and quick, not fortified, dry");
assert.ok(R.rank(["Oil, oat","Cereals, QUAKER, Quick Oats, Dry"].map(sr),"oats")[1].name==="Oil, oat");
{const ch=R.rank(["Chicken, feet, boiled","Chicken, back, cooked, fried","Chicken, giblets, cooked, fried","Chicken, neck, cooked, fried","Chicken, breast, cooked, roasted","Chicken, thigh, cooked, roasted"].map(sr),"chicken").map(f=>f.name);
 assert.ok(/breast|thigh/.test(ch[0])&&/breast|thigh/.test(ch[1]),"chicken: main cuts first");assert.ok(ch.indexOf("Chicken, feet, boiled")>=2);}
{const wh=R.rank(["Rice and Wheat cereal bar","Cereals, WHEATENA, cooked with water","Cereals, CREAM OF WHEAT, instant, dry","Snacks, sesame sticks, wheat-based, salted","Oil, wheat germ","Bread, whole-wheat"].map(sr),"wheat").map(f=>f.name);
 assert.ok(wh.slice(0,2).includes("Bread, whole-wheat"),"wheat: whole-wheat bread near top");}
const ref={cal:89,p:1.1,c:22.8,f:0.3};
const us=[{src:"usda",kind:"Branded",name:"Banana",brand:"Better'n Peanut Butter",per:{cal:265,p:12.5,c:40,f:6}},{src:"usda",kind:"SR Legacy",name:"Bananas, raw",per:ref}];
assert.equal(top(us,"banana",{ref}),"Bananas, raw");
assert.equal(R.rank(us,"banana",{ref}).length,2);
assert.ok(R.matches("egg, whole, raw, fresh",["eggs"])&&!R.matches("milk, goat",["oats"]));
console.log("search ranking: all checks passed");
