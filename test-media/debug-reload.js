const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({headless:true});
  const c=await b.newContext({viewport:{width:1440,height:900}});
  const p=await c.newPage();
  await p.goto('http://localhost:5180/login',{waitUntil:'networkidle'});
  await p.fill('#email','jean.paul@tutore.local');
  await p.fill('#mot_de_passe','Jean@EUL2026!');
  await p.click('button[type="submit"]');
  await p.waitForTimeout(3000);
  await p.goto('http://localhost:5180/formateur/formations',{waitUntil:'networkidle'});
  await p.waitForTimeout(2000);
  const cards=p.locator('div.card-interactive',{hasText:'Formation Multimédia E2E'});
  if(await cards.count()>0){
    await cards.first().locator('a',{hasText:'Construire'}).first().click();
    await p.waitForTimeout(3000);
    // Check localStorage token
    const token=await p.evaluate(()=>localStorage.getItem('token'));
    console.log('Token from localStorage:',token?'present ('+token.slice(0,30)+'...)':'MISSING');
    
    // Reload and check
    await p.reload({waitUntil:'networkidle'});
    await p.waitForTimeout(3000);
    const body=await p.locator('body').innerText();
    // Show all text that mentions key terms
    const keywords=['Image uploadée','Vidéo uploadée','Document uploadé','Texte riche','Fichier texte','Présentation','Chapitre 1','Chapitre 2'];
    for(const kw of keywords){
      console.log(kw+':',body.includes(kw)?'FOUND':'NOT FOUND');
    }
    await p.screenshot({path:'D:/E-LearnigLocal/screenshots/mission-media/debug-reload.png',fullPage:true});
  }
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
