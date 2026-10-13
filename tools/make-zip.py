# Lean project zip: app + assets + source; excludes screenshots/mockups/junk.
import os,re,zipfile,sys
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));os.chdir(root)
txt=''.join(open(f,errors='ignore').read() for f in ['index.html','calorie-sw.js','manifest.webmanifest'])
def keep(p):
  if p.startswith(('.git/','node_modules/')) or '/.' in '/'+p: return False
  if '/' not in p and p.endswith('.png'): return p in txt   # top-level png only if app uses it
  if p.endswith('.mp4') : return p in txt
  return True
out=sys.argv[1] if len(sys.argv)>1 else '/workspace/platejack-project.zip'
z=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED);n=0
for r,d,f in os.walk('.'):
  d[:]=[x for x in d if x not in('.git','node_modules')]
  for x in f:
    p=os.path.relpath(os.path.join(r,x));
    if keep(p): z.write(p);n+=1
z.close();print(n,'files',os.path.getsize(out)//1024,'KB')
