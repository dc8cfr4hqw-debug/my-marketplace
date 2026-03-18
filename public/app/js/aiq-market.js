(function(){
  function confirmPwd(action){
    var pwd = window.prompt('Confirm password to ' + action + ' AIQ:');
    return !!(pwd && pwd.trim());
  }
  function setStatus(msg, ok){
    var el = document.getElementById('aiqOrderStatus');
    if(!el) return;
    el.textContent = msg;
    el.style.color = ok ? '#2ecb87' : '#ef8d98';
  }
  function bind(id, action){
    var el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('click', function(){
      var token = localStorage.getItem('token');
      if(!token) return setStatus('Please login first.', false);
      if(!confirmPwd(action)) return setStatus('Order cancelled.', false);
      setStatus(action + ' order queued for AIQ.', true);
    });
  }
  document.addEventListener('DOMContentLoaded', function(){
    bind('aiqBuy', 'Buy');
    bind('aiqSell', 'Sell');
  });
})();
