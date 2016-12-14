'use strict';

const DashButton = require("dash-button");
const PHY_ADDR = "XX:XX:XX:XX:XX:XX"; // amazon dash botton のmacアドレスを指定

let button = new DashButton(PHY_ADDR);
console.log("listening start");

button.addListener(() => {
  let Zabbix = require('zabbix-promise');
  let zabbix = new Zabbix(
    // zabbixの設定
    'http://localhost/zabbix/api_jsonrpc.php',
    'Admin',
    'password'
  );

  zabbix.login()
    .then(function() {
      return zabbix.request('trigger.get', {
        "output": "triggerid",
        "active": true,
        "monitored": true,
        "withLastEventUnacknowledged": true,
        "maintenance": false,
        "skipDependent": true
      });
    })
    .then(function(value) {
      return new Promise(function(resolve, reject) {
        if (!Array.isArray(value)) {
          reject("no triggers that are not accepted");
        }
        resolve(value);
      });
    })
    .then(function(value) {
      let trigger_array = [];
      value.forEach(function(val, j) {
        trigger_array.push(val.triggerid);
      });

      return zabbix.request('event.get', {
        "output": "eventid",
        "acknowledged": 0,
        "object": 0,
        "source": 0,
        "value": 1,
        "objectids": trigger_array
      });
    })
    .then(function(value) {
      let event_array = [];
      value.forEach(function(val, j) {
        event_array.push(val.eventid);
      });

      return zabbix.request('event.acknowledge', {
        "message": "Accepted by Dash button",
        "eventids": event_array
      });
    })
    .then(function(value) {
      console.log("=== !! accept !! ===");
    })
    .catch(function(reason) {
      console.log("=== !! exception !! ===");
      console.log(reason);
    })


});
