'use strict';

const DashButton = require("dash-button");
const Zabbix = require('zabbix-promise');
const http = require('http');
const param = require("./conf.js");

let button = new DashButton(param.PHY_ADDR);
let targetUrl=param.cs_url + "/ctrl/?mode=" + param.cs_mode + "&repeat=" + param.cs_repeat + "&period=" + param.cs_period + "&json=1";
console.log("listening start");

button.addListener(() => {
  let zabbix = new Zabbix(
    param.zabbix_url,
    param.zabbix_user,
    param.zabbix_password
    // zabbixの設定
    //'http://localhost/zabbix/api_jsonrpc.php',
    //'Admin',
    //'password'
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
      var req = http.get(targetUrl + "&color=" + param.cs_color_ok, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(str) {
          console.log(str);
        });
      });
    })
    .catch(function(reason) {
      console.log("=== !! exception !! ===");
      console.log(reason);
      var req = http.get(targetUrl + "&color=" + param.cs_color_err, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(str) {
          console.log(str);
        });
      });
    })

});
