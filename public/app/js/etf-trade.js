(function(){
  function euro(n){ return new Intl.NumberFormat('en-EU',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n); }
  function setStatus(msg,ok){ var el=document.getElementById('aiqStatus'); if(!el) return; el.textContent=msg; el.style.color=ok?'#2dcb89':'#ef8f99'; }

  function genSeries(points){
    var arr=[]; var v=41.2;
    for(var i=0;i<points;i++){
      if(i < points*0.22) v += (Math.random()*1.1)-0.55;
      else v += (Math.random()*0.42)-0.04;
      v += 0.08;
      arr.push(Number(v.toFixed(2)));
    }
    return arr;
  }

  function buildChart(){
    var c=document.getElementById('aiqChart');
    if(!c||!window.Chart) return;
    var labels=[]; for(var i=1;i<=120;i++) labels.push(i);
    var data=genSeries(120);
    new Chart(c.getContext('2d'),{
      type:'line',
      data:{labels:labels,datasets:[{label:'AIQ Synthetic Price',data:data,borderColor:'#4da0ff',backgroundColor:'rgba(69,141,255,.18)',borderWidth:2,pointRadius:0,fill:true,tension:.25}]},
      options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false}},scales:{x:{display:false,grid:{color:'#16263a'}},y:{grid:{color:'#16263a'},ticks:{color:'#8ea6c4'}}}}
    });
  }

  function calcProjection(){
    var inv=Number(document.getElementById('aiqInvest').value||0);
    var days=Number(document.getElementById('aiqDays').value||0);
    var daily=(inv>=250?10:Math.max(2,inv*0.035));
    var projected=Math.round(daily*days);
    var p=document.getElementById('aiqProj');
    if(p) p.textContent='+'+euro(projected);
  }

  function bindOrders(){
    var longBtn=document.getElementById('aiqLong');
    var shortBtn=document.getElementById('aiqShort');
    [longBtn,shortBtn].forEach(function(btn){
      if(!btn) return;
      btn.addEventListener('click',function(){
        var token=localStorage.getItem('token');
        if(!token) return setStatus('Please login first.',false);
        var pwd=window.prompt('Confirm account password:');
        if(!pwd) return setStatus('Order cancelled.',false);
        setStatus((btn===longBtn?'Long':'Short') + ' order submitted for AIQ simulation.',true);
      });
    });
  }

  document.addEventListener('DOMContentLoaded',function(){
    buildChart();
    calcProjection();
    bindOrders();
    var inv=document.getElementById('aiqInvest');
    var days=document.getElementById('aiqDays');
    if(inv) inv.addEventListener('input',calcProjection);
    if(days) days.addEventListener('input',calcProjection);
    setInterval(function(){ var c=document.getElementById('aiqClock'); if(c) c.textContent=new Date().toLocaleTimeString(); },1000);
  });
})();
