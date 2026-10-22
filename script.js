'use strict';
// にゅスロット v2：完全クライアントサイド。実際の金銭は扱いません。
const KEY='nyuSlotV2';
const INITIAL={coins:100,bet:0,win:0,games:0,bigCount:0,regCount:0,totalWin:0,pending:null};
const $=id=>document.getElementById(id);
function load(){try{const value=JSON.parse(localStorage.getItem(KEY));if(!value||typeof value!=='object')return {...INITIAL};const s={...INITIAL,...value};for(const k of ['coins','bet','win','games','bigCount','regCount','totalWin']){if(!Number.isSafeInteger(s[k])||s[k]<0)s[k]=INITIAL[k]}if(s.bet!==0&&s.bet!==3)s.bet=0;if(s.pending!=='BIG'&&s.pending!=='REG')s.pending=null;return s}catch{return {...INITIAL}}}
let state=load();let spinning=false;let stopped=[true,true,true];let intervals=[];let outcome=null;
const SYMBOLS=['7️⃣','⭐','🍇','🔔','🍒','🍉','🐱'];
const pick=()=>SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];
const rand=()=>{if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}return Math.random()};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{ /* Storage may be unavailable */ }}
function setMessage(message){$('message').textContent=message}
function displayReel(i,middle){const reel=$('r'+i);reel.querySelector('.top').textContent=pick();reel.querySelector('.middle').textContent=middle;reel.querySelector('.bottom').textContent=pick()}
function render(){for(const k of ['coins','bet','win','games','bigCount','regCount','totalWin'])$(k).textContent=state[k].toLocaleString('ja-JP');const lit=!!state.pending;$('lamp').classList.toggle('lit',lit);$('lampImg').src=lit?'assets/lamp-on.png':'assets/lamp-off.png';$('lampImg').alt=lit?'にゅランプ：点灯（ボーナス確定）':'にゅランプ：消灯';$('bonusStatus').classList.toggle('active',lit);$('bonusStatus').textContent=lit?`✨ ${state.pending} BONUS 確定！ 次ゲームで揃えよう！`:'ボーナス待機なし';$('betBtn').disabled=spinning||state.bet!==0||state.coins<3;$('startBtn').disabled=spinning||state.bet!==3;document.querySelectorAll('[data-stop]').forEach((b,i)=>b.disabled=!spinning||stopped[i]);$('resetBtn').disabled=spinning;save()}
function determineOutcome(){// Bonus already stored: force winning symbol on the NEXT game.
 if(state.pending)return {kind:'bonus',symbol:state.pending==='BIG'?'7️⃣':'⭐',bonus:state.pending};
 const r=rand();if(r<1/140){state.pending='BIG';return {kind:'announce',symbol:'🐱'}}if(r<1/140+1/280){state.pending='REG';return {kind:'announce',symbol:'🍉'}}
 const small=rand();if(small<.13)return {kind:'grape',symbol:'🍇'};if(small<.20)return {kind:'bell',symbol:'🔔'};if(small<.33)return {kind:'cherry',symbol:'🍒'};return {kind:'miss',symbol:null};
}
function chooseSymbols(o){if(o.kind==='bonus'||o.kind==='grape'||o.kind==='bell')return [o.symbol,o.symbol,o.symbol];if(o.kind==='cherry')return ['🍒','🐱','🍉'];if(o.kind==='announce')return ['🐱','🍉','🍒'];const a=['🐱','🍉','🍒'].map(()=>pick());if(a.every(x=>x===a[0]))a[2]='🐱'===a[0]?'🍉':'🐱';if(a[0]==='🍒')a[0]='🍉';return a}
$('betBtn').addEventListener('click',()=>{if(spinning||state.bet||state.coins<3)return;state.coins-=3;state.bet=3;state.win=0;setMessage('レバーを押してね！');render()});
$('startBtn').addEventListener('click',()=>{if(spinning||state.bet!==3)return;state.bet=0;state.games++;outcome=determineOutcome();outcome.symbols=chooseSymbols(outcome);spinning=true;stopped=[false,false,false];intervals=outcome.symbols.map((_,i)=>{const reel=$('r'+i);reel.classList.add('spinning');return setInterval(()=>displayReel(i,pick()),85)});setMessage('STOPボタンを押してリールを止めよう！');render()});
function stop(i){if(!spinning||stopped[i])return;stopped[i]=true;clearInterval(intervals[i]);$('r'+i).classList.remove('spinning');displayReel(i,outcome.symbols[i]);if(stopped.every(Boolean))finish();render()}
function finish(){spinning=false;let payout=0;switch(outcome.kind){case 'bonus':payout=outcome.bonus==='BIG'?240:96;state[outcome.bonus==='BIG'?'bigCount':'regCount']++;state.pending=null;setMessage(`🎉 ${outcome.bonus} BONUS！ +${payout}枚！`);break;case 'announce':setMessage('✨ ペカッ！ ボーナス確定！ 次のゲームで揃えよう！');break;case 'grape':payout=8;setMessage('🍇 ぶどう！ +8枚');break;case 'bell':payout=10;setMessage('🔔 ベル！ +10枚');break;case 'cherry':payout=2;setMessage('🍒 チェリー！ +2枚');break;default:setMessage('残念！ 次のゲームへ！')}
 state.win=payout;state.coins+=payout;state.totalWin+=payout;if(state.coins<3)setMessage($('message').textContent+' メダル不足：初期化で再開できます。');outcome=null}
document.querySelectorAll('[data-stop]').forEach(button=>button.addEventListener('click',()=>stop(Number(button.dataset.stop))));
$('resetBtn').addEventListener('click',()=>{if(spinning||!confirm('メダル・ボーナス・プレイ記録をすべて初期化しますか？'))return;state={...INITIAL};setMessage('BET 3 を押してスタート！');render()});
// Keyboard shortcuts: B = BET, Space/Enter = START, 1/2/3 = STOP.
document.addEventListener('keydown',e=>{if(e.repeat||e.target instanceof HTMLButtonElement||e.target instanceof HTMLInputElement)return;const key=e.key.toLowerCase();if(key==='b')$('betBtn').click();else if(key===' '||key==='enter'){e.preventDefault();$('startBtn').click()}else if(['1','2','3'].includes(key))document.querySelector(`[data-stop="${Number(key)-1}"]`).click()});
render();
