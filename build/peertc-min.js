var EventEmitter=function(){"use strict";function e(){this.events={}}return e.prototype.on=function(e,t){return this.events[e]=this.events[e]||[],this.events[e].push(t),this},e.prototype.emit=function(e){var t,n,i=this.events[e],o=Array.prototype.slice.call(arguments,1);if(i){for(t=0,n=i.length;n>t;t++)i[t].apply(null,o);return this}},e.prototype.off=function(e,t){var n,i=this.events[e];return i&&(n=-1!==i.indexOf(t))&&i.splice(n,1),this},e}(),FileReciever=function(){"use strict";function e(e,t){for(var n=atob(e.split(",")[1]),i=[],o=0;o<n.length;o++)i.push(n.charCodeAt(o));return new Blob([new Uint8Array(i)],{type:t})}function t(e,n,i){return this instanceof t?(this.id=e,this.chunks=[],this.meta=n,void(this.sended=0)):new t(e,n,i)}var n=(window.URL||window.webkitURL||window.mozURL||window.msURL||window.oURL,"Mozilla"===navigator.appCodeName);return t.prototype.addChunk=function(e){return this.chunks.push(e),this},t.prototype.download=function(){var t=this,i=t.chunks.join(""),o=document.createElement("a");document.body.appendChild(o),o.style="display: none";var r=e(i,"octet/stream"),s=window.URL.createObjectURL(r);o.href=s,o.download=t.meta.name,o.click(),!n&&window.URL.revokeObjectURL(s),o.parentNode.removeChild(o)},t}(),FileSender=function(){"use strict";function e(){return(Math.random()*(new Date).getTime()).toString(36).toUpperCase().replace(/\./g,"-")}function t(t){var n=this;n.file=t,n.meta={name:t.name,size:t.size,type:t.type},n.chunks=[],n.sended=0,n.id=e(),n.sum}var n=1e3;return t.prototype.chunkify=function(e){var t=this,i=t.file,o=new window.FileReader(i);o.readAsDataURL(i),o.onload=function(i){var o=i.target.result,r=t.chunks;for(t.sum=o.length;o.length;){var s;r.push(o.length>n?s=o.slice(0,n):s=o),o=o.slice(s.length)}e.call(t)}},t.prototype.getChunk=function(){var e;if(this.chunks.length){var e=this.chunks.shift();return this.sended+=e.length,e}return null},t}(),Connector=function(){"use strict";function e(n){return this instanceof e?(this.pc=new t(o),this.id=n.id,this.to=n.to,this.peertc=n.peertc,this.__init(n),this.queue=[],this.sending=!1,this.fileSenders={},void(this.fileRecievers={})):new e(n)}var t=window.PeerConnection||window.webkitPeerConnection00||window.webkitRTCPeerConnection||window.mozRTCPeerConnection,n=window.mozRTCIceCandidate||window.RTCIceCandidate,i=window.mozRTCSessionDescription||window.RTCSessionDescription,o={iceServers:[{url:"stun:stun.l.google.com:19302"}]};return e.prototype.__initDataChannel=function(e){var t=this;t.channel=e,e.onopen=function(){t.peertc.emit("open",t.to)},e.onmessage=function(e){var n=JSON.parse(e.data);"message"===n.type?t.__parseMessage(n.data):"file"===n.type&&t.__parseFileChunk(n.data)},e.onclose=function(){t.close(),t.peertc.emit("close",t.to)},e.onerror=function(e){t.peertc.emit("error",e,t.to)}},e.prototype.__parseMessage=function(e){var t=this.to;this.peertc.emit("message",e,t)},e.prototype.__parseFileChunk=function(e){var t=this,n=t.to,i=t.fileRecievers;i[n]=i[n]||{};var o=i[n][e.id]=i[n][e.id]||new FileReciever(e.id,e.meta,n);o.addChunk(e.chunk),t.peertc.emit("fileChunk",e,n),e.sended===e.sum&&(o.download(),t.peertc.emit("file",o.meta,n),delete i[n][e.id])},e.prototype.__init=function(e){var t=this,n=t.pc,i=t.id,o=t.to;n.onicecandidate=function(e){e.candidate&&t.peertc.socket.send(JSON.stringify({event:"__ice_candidate",data:{label:e.candidate.sdpMLineIndex,candidate:e.candidate.candidate,from:i,to:o}}))},n.ondatachannel=function(e){t.__initDataChannel(e.channel)},e.isOpenner&&t.__initDataChannel(n.createDataChannel(o))},e.prototype.sendFile=function(e){var t=this,n=n;if("string"==typeof e&&(e=document.querySelector(e)),!e.files||!e.files[0])return void t.peertc.emit("error",new Error("no file need to be send"),t.id);n=e.files[0];var i=new FileSender(n);return i.chunkify(function(){function e(){var n=i.getChunk();n&&(t.queue.push({type:"file",data:{sum:i.sum,sended:i.sended,meta:i.meta,id:i.id,chunk:n}}),setTimeout(e,0)),t.sending||setTimeout(function(){t.__send()},0)}setTimeout(e,0)}),t},e.prototype.close=function(){var e=this;e.sending=!1,e.queue=[],e.channel&&"connecting"===e.channel.readyState.toLowerCase()&&e.channel.close(),e.channel=null,"closed"!==e.pc.signalingState&&e.pc.close(),delete e.peertc.connectors[e.to]},e.prototype.send=function(e){var t=this;return t.queue.push({type:"message",data:e}),t.sending||setTimeout(function(){t.__send()},0),t},e.prototype.__send=function(){var e=this,t=e.queue;if(0!==t.length){e.sending=!0;var n=t[0],i=e.channel;if(i){var o=i.readyState.toLowerCase();"open"===o?(n.from=e.id,n.to=e.to,i.send(JSON.stringify(n)),t.shift(),e.sending=!1):"connecting"===o?setTimeout(function(){e.__send()},0):e.close()}}},e.prototype.__addCandidate=function(e){this.pc&&this.pc.addIceCandidate(new n(e))},e.prototype.__sendOffer=function(){function e(){var o=i.readyState;1===o?n.createOffer(function(e){n.setLocalDescription(e),i.send(JSON.stringify({event:"__offer",data:{sdp:e,to:t.to,from:t.id}}))},function(e){t.peertc.emit("error",e)}):0===o&&setTimeout(e,0)}var t=this,n=t.pc,i=t.peertc.socket;setTimeout(e,0)},e.prototype.__sendAnswer=function(e){var t=e.sdp,n=this,o=n.pc;o.setRemoteDescription(new i(t)),o.createAnswer(function(e){o.setLocalDescription(e),n.peertc.socket.send(JSON.stringify({event:"__answer",data:{from:n.id,to:n.to,sdp:e}}))},function(e){n.peertc.emit("error",e)})},e.prototype.__recieveAnswer=function(e){this.pc.setRemoteDescription(new i(e.sdp))},e}(),SocketConnector=function(){function e(e){return function(t){var n=t;"message"===n.type?e.__parseMessage(n.data,e.to):"file"===n.type&&e.__parseFileChunk(n.data,e.to)}}function t(e){return this instanceof t?(this.id=e.id,this.to=e.to,this.peertc=e.peertc,this.queue=[],this.sending=!1,this.fileSenders={},this.fileRecievers={},this.channel=peertc.socket,void this.__init(e)):new t(e)}return t.prototype.__init=function(t){var n=this;n.recieveCb=e(n),n.peertc.on("_socket",n.recieveCb),t.isOpenner||setTimeout(function(){n.peertc.emit("open",n.to)},0)},t.prototype.__parseMessage=function(e,t){this.peertc.emit("message",e,t)},t.prototype.__parseFileChunk=function(e,t){var n=this,i=n.fileRecievers;i[t]=i[t]||{};var o=i[t][e.id]=i[t][e.id]||new FileReciever(e.id,e.meta,t);o.addChunk(e.chunk),n.peertc.emit("fileChunk",e,t),e.sended===e.sum&&(o.download(),n.peertc.emit("file",o.meta,t),delete i[t][e.id])},t.prototype.sendFile=function(e){var t=this,n=n;if("string"==typeof e&&(e=document.querySelector(e)),!e.files||!e.files[0])return void t.peertc.emit("error",new Error("no file need to be send"),t.id);n=e.files[0];var i=new FileSender(n);return i.chunkify(function(){function e(){var n=i.getChunk();n&&(t.queue.push({type:"file",data:{sum:i.sum,sended:i.sended,meta:i.meta,id:i.id,chunk:n}}),setTimeout(e,0)),t.sending||setTimeout(function(){t.__send()},0)}setTimeout(e,0)}),t},t.prototype.close=function(){var e=this,t=e.to;e.sending=!1,e.queue=[],e.channel=null,e.peertc.off(e.recieveCb),delete e.peertc.connectors[t],e.peertc.emit("close",t)},t.prototype.send=function(e){var t=this;return t.queue.push({type:"message",data:e}),t.sending||setTimeout(function(){t.__send()},0),t},t.prototype.__send=function(){var e=this,t=e.queue;if(0!==t.length){e.sending=!0;var n=t[0],i=e.channel;if(i){var o=i.readyState;1===o?(n.from=e.id,n.to=e.to,i.send(JSON.stringify({event:"__socket",data:n})),t.shift(),e.sending=!1):0===o?setTimeout(function(){e.__send()},0):e.close()}}},t.prototype.__sendOffer=function(){function e(){var i=n.readyState;1===i?n.send(JSON.stringify({event:"__offer",data:{to:t.to,from:t.id}})):0===i&&setTimeout(e,0)}var t=this,n=(t.pc,t.peertc.socket);setTimeout(e,0)},t.prototype.__sendAnswer=function(){function e(){var i=n.readyState;1===i?n.send(JSON.stringify({event:"__answer",data:{to:t.to,from:t.id}})):0===i&&setTimeout(e,0)}var t=this,n=(t.pc,t.peertc.socket);setTimeout(e,0)},t.prototype.__recieveAnswer=function(){this.peertc.emit("open",this.to)},t}();!function(e){"function"==typeof define&&define.amd?define([],function(){return e()}):"function"==typeof define&&define.cmd?define(function(t,n,i){i.exports=e()}):window.Peertc=e()}(function(){"use strict";function e(t,n){return this instanceof e?i?(this.id=n,this.socket=new WebSocket(t),this.connectors={},void this.__init()):void this.emit("error",new Error("WebSocket is not supported, Please upgrade your browser!")):new e(t,n)}var t=window.PeerConnection||window.webkitPeerConnection00||window.webkitRTCPeerConnection||window.mozRTCPeerConnection,n=!1,i=!!WebSocket;return function(){var e;try{t||(n=!1),e=new t(null),n=e&&e.createDataChannel?!0:!1}catch(i){n=!1}}(),n=!1,e.prototype=new EventEmitter,e.prototype.__init=function(){var e=this,t=e.id,n=e.connectors,i=e.socket;i.onopen=function(){i.send(JSON.stringify({event:"__init",data:{id:t}}))},i.onmessage=function(t){var n=JSON.parse(t.data);n.event?e.emit(n.event,n.data,i):e.emit("message",n.data,i)},i.onerror=function(){e.emit("error",new Error("Socket error"))},i.onclose=function(){for(var e in n)n[e].close();n={}},e.on("_init",function(){e.emit("init")}),e.on("_ice_candidate",function(e){n[e.from].__addCandidate(e)}),e.on("_offer",function(t){var n=e.__createConnector(t.from,!1);n.__sendAnswer(t)}),e.on("_answer",function(e){n[e.from].__recieveAnswer(e)})},e.prototype.connect=function(e){var t,n=this;return n.connectors[e]?t=n.connectors[e]:(t=n.__createConnector(e,!0),t.__sendOffer()),t},e.prototype.__createConnector=function(e,t){var i=this;return i.connectors[e]=n?new Connector({to:e,id:i.id,peertc:i,isOpenner:t}):new SocketConnector({to:e,id:i.id,peertc:i,isOpenner:t})},e});