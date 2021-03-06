/**
 * Глобальные переменные и общие методы фреймворка __metadata.js__ <i>Oknosoft data engine</i> <br />&copy; http://www.oknosoft.ru 2009-2015
 *
 * Экспортирует глобальную переменную __$p__ типа {{#crossLink "MetaEngine"}}{{/crossLink}}
 * @module  common
 * @author	Evgeniy Malyarov
 */

/**
 * Класс глобального объекта фреймворка __Лёгкого клиента__
 * @class MetaEngine
 * @static
 */
function MetaEngine() {
	this.version = "0.9.193";
	this.toString = function(){
		return "Oknosoft data engine. v:" + this.version;
	};
}

/**
 * Для совместимости со старыми модулями, публикуем $p глобально<br />
 * Кроме этой переменной, metadata.js ничего не экспортирует
 * @property $p
 * @for window
 */
var $p = new MetaEngine();

/**
 * Обёртка для подключения через AMD или CommonJS
 * https://github.com/umdjs/umd
 */
if (typeof define === 'function' && define.amd) {
	// Support AMD (e.g. require.js)
	define('$p', $p);
} else if (typeof module === 'object' && module) { // could be `null`
	// Support CommonJS module
	module.exports = $p;
}

if(typeof window !== "undefined"){

	window.$p = $p;

	/**
	 * Загружает скрипты и стили синхронно и асинхронно
	 * @method load_script
	 * @for MetaEngine
	 * @param src {String} - url ресурса
	 * @param type {String} - "link" или "script"
	 * @param [callback] {function} - функция обратного вызова после загрузки скрипта
	 * @async
	 */
	$p.load_script = function (src, type, callback) {
		var s = document.createElement(type);
		if (type == "script") {
			s.type = "text/javascript";
			s.src = src;
			if(callback){
				s.async = true;
				s.addEventListener('load', callback, false);
			}else
				s.async = false;
		} else {
			s.type = "text/css";
			s.rel = "stylesheet";
			s.href = src;
		}
		document.head.appendChild(s);
	};

	/**
	 * Если браузер не поддерживает Promise, загружаем полифил
	 */
	if(typeof Promise !== "function")
		$p.load_script("https://www.promisejs.org/polyfills/promise-7.0.1.min.js", "script");

	/**
	 * Если контекст исполнения - браузер, загружаем таблицы стилей
	 */
	(function(w){
		var i, surl, sname, load_dhtmlx = true, load_meta = true;

		if("dhtmlx" in w){
			for(i in document.scripts){
				if(document.scripts[i].src.indexOf("metadata.js")!=-1){
					sname = "metadata.js";
					surl = document.scripts[i].src;
					break;
				}else if(document.scripts[i].src.indexOf("metadata.min.js")!=-1){
					sname = "metadata.min.js";
					surl = document.scripts[i].src;
					break;
				}
			}
			// стили загружаем только при необходимости
			for(i=0; i < document.styleSheets.length; i++){
				if(document.styleSheets[i].href){
					if(document.styleSheets[i].href.indexOf("dhtmlx.css")!=-1)
						load_dhtmlx = false;
					else if(document.styleSheets[i].href.indexOf("metadata.css")!=-1)
						load_meta = false;
				}
			}
			if(load_dhtmlx)
				$p.load_script(surl.replace(sname, "dhtmlx.css"), "link");
			if(load_meta)
				$p.load_script(surl.replace(sname, "metadata.css"), "link");

			// задаём путь к картинкам
			dhtmlx.image_path = surl.replace(sname, "imgs/");

			// задаём основной скин
			dhtmlx.skin = "dhx_web";

			// запрещаем добавлять dhxr+date() к запросам get внутри dhtmlx
			dhx4.ajax.cache = true;
		}
	})(window);

}else{

	// локальное хранилище внутри node.js
	if(typeof localStorage === "undefined")
		localStorage = new require('node-localstorage').LocalStorage('./localstorage');

	// alasql внутри node.js
	if (typeof window === "undefined" && typeof alasql === "undefined")
		alasql = require('alasql');

}



/**
 * Синтаксический сахар для defineProperty
 * @method _define
 * @for Object
 */
Object.defineProperty(Object.prototype, "_define", {
	value: function( key, descriptor ) {
		if( descriptor ) {
			Object.defineProperty( this, key, descriptor );
		} else {
			Object.defineProperties( this, key );
		}
		return this;
	},
	enumerable: false
});

/**
 * Реализует наследование текущим конструктором свойств и методов конструктора Parent
 * @method _extend
 * @for Object
 * @param Parent {function}
 */
Object.prototype._define("_extend", {
	value: function( Parent ) {
		var F = function() { };
		F.prototype = Parent.prototype;
		this.prototype = new F();
		this.prototype.constructor = this;
		this._define("superclass", {
			value: Parent.prototype,
			enumerable: false
		});
	},
	enumerable: false
});

/**
 * Копирует все свойства из src в текущий объект исключая те, что в цепочке прототипов src до Object
 * @method _mixin
 * @for Object
 * @param src {Object} - источник
 * @return {Object}
 */
Object.prototype._define("_mixin", {
	value: function(src, include, exclude ) {
		var tobj = {}, i, f; // tobj - вспомогательный объект для фильтрации свойств, которые есть у объекта Object и его прототипа
		if(include && include.length){
			for(i = 0; i<include.length; i++){
				f = include[i];
				if(exclude && exclude.indexOf(f)!=-1)
					continue;
				// копируем в dst свойства src, кроме тех, которые унаследованы от Object
				if((typeof tobj[f] == "undefined") || (tobj[f] != src[f]))
					this[f] = src[f];
			}
		}else{
			for(f in src){
				if(exclude && exclude.indexOf(f)!=-1)
					continue;
				// копируем в dst свойства src, кроме тех, которые унаследованы от Object
				if((typeof tobj[f] == "undefined") || (tobj[f] != src[f]))
					this[f] = src[f];
			}
		}
		return this;
	},
	enumerable: false
});

/**
 * Создаёт копию объекта
 * @method _clone
 * @for Object
 * @param src {Object|Array} - исходный объект
 * @param [exclude_propertyes] {Object} - объект, в ключах которого имена свойств, которые не надо копировать
 * @returns {*}
 */
Object.prototype._define("_clone", {
	value: function() {
		if(!this || "object" !== typeof this)
			return this;
		var p, v, c = "function" === typeof this.pop ? [] : {};
		for(p in this){
			if (this.hasOwnProperty(p)){
				v = this[p];
				if(v && "object" === typeof v)
					c[p] = v._clone();
				else
					c[p] = v;
			}
		}
		return c;
	},
	enumerable: false
});


/**
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 * @method dateFormat
 * @for MetaEngine
 * @param date {Date} - источник
 * @param mask {dateFormat.masks} - маска формата
 * @param utc {Boolean} Converts the date from local time to UTC/GMT
 * @return {String}
 */
$p.dateFormat = function () {
	var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
			return val;
		};

	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc) {
		var dF = $p.dateFormat;

		if(!mask)
			mask = $p.dateFormat.masks.ru;

		// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
		if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
			mask = date;
			date = undefined;
		}

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date;
		if (isNaN(date)) date = new Date(0);

		mask = String(dF.masks[mask] || mask || dF.masks["default"]);

		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) == "UTC:") {
			mask = mask.slice(4);
			utc = true;
		}

		var _ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
				d:    d,
				dd:   pad(d),
				ddd:  dF.i18n.dayNames[D],
				dddd: dF.i18n.dayNames[D + 7],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  dF.i18n.monthNames[m],
				mmmm: dF.i18n.monthNames[m + 12],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

		return mask.replace(token, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
	};
}();

/**
 * Some common format strings
 */
$p.dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	shortDate:      "m/d/yy",
	mediumDate:     "mmm d, yyyy",
	longDate:       "mmmm d, yyyy",
	fullDate:       "dddd, mmmm d, yyyy",
	shortTime:      "h:MM TT",
	mediumTime:     "h:MM:ss TT",
	longTime:       "h:MM:ss TT Z",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
	isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",
	atom:           "yyyy-mm-dd'T'HH:MM:ss'Z'",
	ru:				"dd.mm.yyyy HH:MM",
	short_ru:       "dd.mm.yyyy",
	date:           "dd.mm.yy",
	date_time:		"dd.mm.yy HH:MM"
};

/**
 * Наша promise-реализация ajax
 * @property ajax
 * @for MetaEngine
 * @type Ajax
 * @static
 */
$p.ajax = new (

	/**
	 * Наша promise-реализация ajax
	 * @class Ajax
	 * @static
	 */
	function Ajax() {

		function _call(method, url, postData, auth, beforeSend) {

			// Возвращаем новое Обещание.
			return new Promise(function(resolve, reject) {

				// Делаем привычные XHR вещи
				var req = new XMLHttpRequest();

				if(auth){
					var username, password;
					if(typeof auth == "object" && auth.username && auth.hasOwnProperty("password")){
						username = auth.username;
						password = auth.password;
					}else{
						username = $p.ajax.username;
						password = $p.ajax.password;
					}
					req.open(method, url, true, username, password);
					req.withCredentials = true;
					req.setRequestHeader("Authorization", "Basic " +
						btoa(unescape(encodeURIComponent(username + ":" + password))));
				}
				else
					req.open(method, url, true);

				if(beforeSend)
					beforeSend.call(this, req);

				if (method == "POST") {
					if(!this.hide_headers){
						req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
						req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
					}
				} else {
					postData = null;
				}

				req.onload = function() {
					// Этот кусок вызовется даже при 404’ой ошибке
					// поэтому проверяем статусы ответа
					if (req.status == 200 && (req.response instanceof Blob || req.response.substr(0,9)!=="<!DOCTYPE")) {
						// Завершаем Обещание с текстом ответа
						resolve(req);
					}
					else {
						// Обламываемся, и передаём статус ошибки
						// что бы облегчить отладку и поддержку
						if(req.response)
							reject({
								message: req.statusText,
								description: req.response,
								status: req.status
							});
						else
							reject(Error(req.statusText));
					}
				};

				// отлавливаем ошибки сети
				req.onerror = function() {
					reject(Error("Network Error"));
				};

				// Делаем запрос
				req.send(postData);
			});

		}

		/**
		 * имя пользователя для авторизации на сервере
		 * @property username
		 * @type String
		 */
		this.username = "";

		/**
		 * пароль пользователя для авторизации на сервере
		 * @property password
		 * @type String
		 */
		this.password = "";

		/**
		 * признак авторизованности на сервере
		 * @property authorized
		 * @type Boolean
		 */
		this.authorized = false;

		/**
		 * Выполняет асинхронный get запрос
		 * @method get
		 * @param url {String}
		 * @return {Promise.<T>}
		 * @async
		 */
		this.get = function(url) {
			return _call("GET", url);
		};

		/**
		 * Выполняет асинхронный post запрос
		 * @method post
		 * @param url {String}
		 * @param postData {String} - данные для отправки на сервер
		 * @return {Promise.<T>}
		 * @async
		 */
		this.post = function(url, postData) {
			if (arguments.length == 1) {
				postData = "";
			} else if (arguments.length == 2 && (typeof(postData) == "function")) {
				onLoad = postData;
				postData = "";
			} else {
				postData = String(postData);
			}
			return _call("POST", url, postData);
		};

		/**
		 * Выполняет асинхронный get запрос с авторизацией и возможностью установить заголовки http
		 * @method get_ex
		 * @param url {String}
		 * @param auth {Boolean}
		 * @param beforeSend {function} - callback перед отправкой запроса на сервер
		 * @return {Promise.<T>}
		 * @async
		 */
		this.get_ex = function(url, auth, beforeSend){
			return _call("GET", url, null, auth, beforeSend);

		};

		/**
		 * Выполняет асинхронный post запрос с авторизацией и возможностью установить заголовки http
		 * @method post_ex
		 * @param url {String}
		 * @param postData {String} - данные для отправки на сервер
		 * @param auth {Boolean}
		 * @param beforeSend {function} - callback перед отправкой запроса на сервер
		 * @return {Promise.<T>}
		 * @async
		 */
		this.post_ex = function(url, postData, auth, beforeSend){
			return _call("POST", url, postData, auth, beforeSend);
		};

		/**
		 * Выполняет асинхронный put запрос с авторизацией и возможностью установить заголовки http
		 * @method put_ex
		 * @param url {String}
		 * @param putData {String} - данные для отправки на сервер
		 * @param auth {Boolean}
		 * @param beforeSend {function} - callback перед отправкой запроса на сервер
		 * @return {Promise.<T>}
		 * @async
		 */
		this.put_ex = function(url, putData, auth, beforeSend){
			return _call("PUT", url, putData, auth, beforeSend);
		};

		/**
		 * Выполняет асинхронный delete запрос с авторизацией и возможностью установить заголовки http
		 * @method delete_ex
		 * @param url {String}
		 * @param auth {Boolean}
		 * @param beforeSend {function} - callback перед отправкой запроса на сервер
		 * @return {Promise.<T>}
		 * @async
		 */
		this.delete_ex = function(url, auth, beforeSend){
			return _call("DELETE", url, null, auth, beforeSend);

		};

		/**
		 * Получает с сервера двоичные данные (pdf отчета или картинку или произвольный файл) и показывает его в новом окне, используя data-url
		 * @method get_and_show_blob
		 * @param url {String} - адрес, по которому будет произведен запрос
		 * @param post_data {Object|String} - данные запроса
		 * @param callback {function}
		 * @async
		 */
		this.get_and_show_blob = function(url, post_data){

			var params = "menubar=no,toolbar=no,location=no,status=no,directories=no,resizable=yes,scrollbars=yes",
				wnd_print;

			return this.post_ex(url,
				typeof post_data == "object" ? JSON.stringify(post_data) : post_data, true, function(xhr){
					xhr.responseType = "blob";
				})
				.then(function(req){
					url = window.URL.createObjectURL(req.response);
					wnd_print = window.open(url, "wnd_print", params);
					wnd_print.onload = function(e) {
						window.URL.revokeObjectURL(url);
					};
					return wnd_print;
				});
		};

		/**
		 * Получает с сервера двоичные данные (pdf отчета или картинку или произвольный файл) и показывает диалог сохранения в файл
		 * @method get_and_save_blob
		 * @param url {String} - адрес, по которому будет произведен запрос
		 * @param post_data {Object|String} - данные запроса
		 * @param file_name {String} - имя файла для сохранения
		 * @return {Promise.<T>}
		 */
		this.get_and_save_blob = function(url, post_data, file_name){

			return this.post_ex(url,
				typeof post_data == "object" ? JSON.stringify(post_data) : post_data, true, function(xhr){
					xhr.responseType = "blob";
				})
				.then(function(req){
					require("filesaver").saveAs(req.response, file_name);
				});
		};

		this.default_attr = function (attr, url) {
			if(!attr.url)
				attr.url = url;
			if(!attr.username)
				attr.username = this.username;
			if(!attr.password)
				attr.password = this.password;
		}

	}
);

/**
 * Несколько статических методов двумерной математики
 * @property m
 * @for MetaEngine
 * @static
 */
$p.m = {

	/**
	 * ПоложениеТочкиОтносительноПрямой
	 * @param x {Number}
	 * @param y {Number}
	 * @param x1 {Number}
	 * @param y1 {Number}
	 * @param x2 {Number}
	 * @param y2 {Number}
	 * @return {number}
	 */
	point_pos: function(x,y, x1,y1, x2,y2){
		if (Math.abs(x1-x2) < 0.2){return (x-x1)*(y1-y2);}	// вертикаль  >0 - справа, <0 - слева,=0 - на линии
		if (Math.abs(y1-y2) < 0.2){return (y-y1)*(x2-x1);}	// горизонталь >0 - снизу, <0 - сверху,=0 - на линии
		return (y-y1)*(x2-x1)-(y2-y1)*(x-x1);				// >0 - справа, <0 - слева,=0 - на линии
	},

	/**
	 * КоординатыЦентраДуги
	 * @param x1 {Number}
	 * @param y1 {Number}
	 * @param x2 {Number}
	 * @param y2 {Number}
	 * @param r0 {Number}
	 * @param ccw {Boolean}
	 * @return {Point}
	 */
	arc_cntr: function(x1,y1, x2,y2, r0, ccw){
		var a,b,p,r,q,yy1,xx1,yy2,xx2;
		if(ccw){
			var tmpx=x1, tmpy=y1;
			x1=x2; y1=y2; x2=tmpx; y2=tmpy;
		}
		if (x1!=x2){
			a=(x1*x1 - x2*x2 - y2*y2 + y1*y1)/(2*(x1-x2));
			b=((y2-y1)/(x1-x2));
			p=b*b+ 1;
			r=-2*((x1-a)*b+y1);
			q=(x1-a)*(x1-a) - r0*r0 + y1*y1;
			yy1=(-r + Math.sqrt(r*r - 4*p*q))/(2*p);
			xx1=a+b*yy1;
			yy2=(-r - Math.sqrt(r*r - 4*p*q))/(2*p);
			xx2=a+b*yy2;
		} else{
			a=(y1*y1 - y2*y2 - x2*x2 + x1*x1)/(2*(y1-y2));
			b=((x2-x1)/(y1-y2));
			p=b*b+ 1;
			r=-2*((y1-a)*b+x1);
			q=(y1-a)*(y1-a) - r0*r0 + x1*x1;
			xx1=(-r - Math.sqrt(r*r - 4*p*q))/(2*p);
			yy1=a+b*xx1;
			xx2=(-r + Math.sqrt(r*r - 4*p*q))/(2*p);
			yy2=a+b*xx2;
		}

		if ($p.m.point_pos(xx1,yy1, x1,y1, x2,y2)>0)
			return {x: xx1, y: yy1};
		else
			return {x: xx2, y: yy2}
	},

	/**
	 * Рассчитывает координаты точки, лежащей на окружности
	 * @param x1 {Number}
	 * @param y1 {Number}
	 * @param x2 {Number}
	 * @param y2 {Number}
	 * @param r {Number}
	 * @param arc_ccw {Boolean}
	 * @param more_180 {Boolean}
	 * @return {Point}
	 */
	arc_point: function(x1,y1, x2,y2, r, arc_ccw, more_180){
		var point = {x: (x1 + x2) / 2, y: (y1 + y2) / 2};
		if (r>0){
			var dx = x1-x2, dy = y1-y2, dr = r*r-(dx*dx+dy*dy)/4, l, h, centr;
			if(dr >= 0){
				centr = $p.m.arc_cntr(x1,y1, x2,y2, r, arc_ccw);
				dx = centr.x - point.x;
				dy = point.y - centr.y;	// т.к. Y перевернут
				l = Math.sqrt(dx*dx + dy*dy);

				if(more_180)
					h = r+Math.sqrt(dr);
				else
					h = r-Math.sqrt(dr);

				point.x += dx*h/l;
				point.y += dy*h/l;
			}
		}
		return point;
	}
};

/**
 * Пустые значения даты и уникального идентификатора
 * @property blank
 * @for MetaEngine
 * @static
 */
$p.blank = new function Blank() {
	this.date = new Date("0001-01-01");
	this.guid = "00000000-0000-0000-0000-000000000000";

	/**
	 * Возвращает пустое значение по типу метаданных
	 * @method by_type
	 * @param mtype {Object} - поле type объекта метаданных (field.type)
	 * @return {any}
	 */
	this.by_type = function(mtype){
		var v;
		if(mtype.is_ref)
			v = $p.blank.guid;
		else if(mtype.date_part)
			v = $p.blank.date;
		else if(mtype["digits"])
			v = 0;
		else if(mtype.types && mtype.types[0]=="boolean")
			v = false;
		else
			v = "";
		return v;
	};
};


/**
 * Проверяет, является ли значение guid-ом
 * @method is_guid
 * @for MetaEngine
 * @param v {*} - проверяемое значение
 * @return {Boolean} - true, если значение соответствует регурярному выражению guid
 */
$p.is_guid = function(v){
	if(typeof v !== "string" || v.length < 36)
		return false;
	else if(v.length > 36)
		v = v.substr(0, 36);
	return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v)
};

/**
 * Проверяет, является ли значение пустым идентификатором
 * @method is_empty_guid
 * @for MetaEngine
 * @param v {*} - проверяемое значение
 * @return {Boolean} - true, если v эквивалентен пустому guid
 */
$p.is_empty_guid = function (v) {
	return !v || v === $p.blank.guid;
};

/**
 * Генерирует новый guid
 * @method generate_guid
 * @for MetaEngine
 * @return {String}
 */
$p.generate_guid = function(){
	var d = new Date().getTime();
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (d + Math.random()*16)%16 | 0;
		d = Math.floor(d/16);
		return (c=='x' ? r : (r&0x7|0x8)).toString(16);
	});
};

/**
 * Извлекает guid из строки или ссылки или объекта
 * @method fix_guid
 * @param ref {*} - значение, из которого надо извлечь идентификатор
 * @param generate {Boolean} - указывает, генерировать ли новый guid для пустого значения
 * @return {String}
 */
$p.fix_guid = function(ref, generate){

	if(ref && typeof ref == "string")
		;

	else if(ref instanceof DataObj)
		return ref.ref;

	else if(ref && typeof ref == "object"){
		if(ref.presentation){
			if(ref.ref)
				return ref.ref;
			else if(ref.name)
				return ref.name;
		}
		else
			ref = (typeof ref.ref == "object" && ref.ref.hasOwnProperty("ref")) ?  ref.ref.ref : ref.ref;
	}

	if($p.is_guid(ref) || generate === false)
		return ref;

	else if(generate)
		return $p.generate_guid();

	else
		return $p.blank.guid;
};

/**
 * Приводит значение к типу Число
 * @method fix_number
 * @param str {*} - приводиме значение
 * @param [strict=false] {Boolean} - конвертировать NaN в 0
 * @return {Number}
 */
$p.fix_number = function(str, strict){
	var v = parseFloat(str);
	if(!isNaN(v))
		return v;
	else if(strict)
		return 0;
	else
		return str;
};

/**
 * Приводит значение к типу Булево
 * @method fix_boolean
 * @param str {String}
 * @return {boolean}
 */
$p.fix_boolean = function(str){
	if(typeof str === "string")
		return !(!str || str.toLowerCase() == "false");
	else
		return !!str;
};

/**
 * Приводит значение к типу Дата
 * @method fix_date
 * @param str {any} - приводиме значение
 * @param [strict=false] {boolean} - если истина и значение не приводится к дате, возвращать пустую дату
 * @return {Date|any}
 */
$p.fix_date = function(str, strict){
	var dfmt = /(^\d{1,4}[\.|\\/|-]\d{1,2}[\.|\\/|-]\d{1,4})(\s*(?:0?[1-9]:[0-5]|1(?=[012])\d:[0-5])\d\s*[ap]m)?$/, d;
	if(str && typeof str == "string" && dfmt.test(str.substr(0,10))){
		d=new Date(str);
		if(d && d.getFullYear()>0)
			return d;
	}
	if(strict)
		return $p.blank.date;
	else
		return str;
};

/**
 * Добавляет days дней к дате
 * @method date_add_day
 * @param date {Date} - исходная дата
 * @param days {Number} - число дней, добавляемых к дате (может быть отрицательным)
 * @return {Date}
 */
$p.date_add_day = function(date, days){
	var newDt = new Date();
	newDt.setDate(date.getDate() + days);
	return newDt;
};

/**
 * Запрещает всплывание события
 * @param e {MouseEvent|KeyboardEvent}
 * @returns {Boolean}
 */
$p.cancel_bubble = function(e) {
	var evt = (e || event);
	if (evt.stopPropagation)
		evt.stopPropagation();
	if (!evt.cancelBubble)
		evt.cancelBubble = true;
	return false
};

/**
 * Масштабирует svg
 * @param svg_current {String} - исходная строка svg
 * @param size {Number} - требуемый размер картинки
 * @param padding {Number} - отступ от границы viewBox
 * @return {String}
 */
$p.scale_svg = function(svg_current, size, padding){
	var j, k, svg_head, svg_body, head_ind, viewBox, svg_j = {};

	head_ind = svg_current.indexOf(">");
	svg_head = svg_current.substring(5, head_ind).split(' ');
	svg_body = svg_current.substr(head_ind+1);
	svg_body = svg_body.substr(0, svg_body.length - 6);

	// получаем w, h и формируем viewBox="0 0 400 100"
	for(j in svg_head){
		svg_current = svg_head[j].split("=");
		if(svg_current[0] == "width" || svg_current[0] == "height"){
			svg_current[1] = Number(svg_current[1].replace(/"/g, ""));
			svg_j[svg_current[0]] = svg_current[1];
		}
	}
	viewBox = 'viewBox="0 0 ' + (svg_j["width"] - padding) + ' ' + (svg_j["height"] - padding) + '"';
	k = size / (svg_j["height"] - padding);
	svg_j["height"] = size;
	svg_j["width"] = Math.round(svg_j["width"] * k);

	return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="' +
		svg_j["width"] + '" height="' + svg_j["height"] + '" xml:space="preserve" ' + viewBox + '>' + svg_body + '</svg>';
};

/**
 * Заменяет в строке критичные для xml символы
 * @method normalize_xml
 * @param str {string} - исходная строка, в которой надо замаскировать символы
 * @return {XML|string}
 */
$p.normalize_xml = function(str){
	if(!str) return "";
	var entities = { '&':  '&amp;', '"': '&quot;',  "'":  '&apos;', '<': '&lt;', '>': '&gt;'};
	return str.replace(	/[&"'<>]/g, function (s) {return entities[s];});
};

/**
 * Добавляет в форму функциональность вызова справки
 * @param wnd {dhtmlXWindowsCell}
 * @param [path] {String} - url справки
 */
$p.bind_help = function (wnd, path) {

	function frm_help(win){
		if(!win.help_path){
			$p.msg.show_msg({
				title: "Справка",
				type: "alert-info",
				text: $p.msg.not_implemented
			});
			return;
		}
	}

	if(wnd instanceof dhtmlXLayoutCell) {
		// TODO реализовать кнопку справки для приклеенной формы
	}else{
		if(!wnd.help_path && path)
			wnd.help_path = path;

		wnd.button('help').show();
		wnd.button('help').enable();
		wnd.attachEvent("onHelp", frm_help);
	}

};

/**
 * Возвращает координату элемента
 * @param elm {HTMLElement}
 */
$p.get_offset = function(elm) {
	var offset = {left: 0, top:0};
	if (elm.offsetParent) {
		do {
			offset.left += elm.offsetLeft;
			offset.top += elm.offsetTop;
		} while (elm = elm.offsetParent);
	}
	return offset;
};

/**
 * Сообщения пользователю и строки нитернационализации
 * @property msg
 * @type Messages
 * @static
 */
$p.msg = new function Messages(){

	this.toString = function(){return "Интернационализация сообщений"};

	/**
	 * расширяем мессанджер
	 */
	if(typeof window !== "undefined" && "dhtmlx" in window){

		/**
		 * Показывает информационное сообщение или confirm
		 * @method show_msg
		 * @for Messages
		 * @param attr {object} - атрибуты сообщения attr.type - [info, alert, confirm, modalbox, info-error, alert-warning, confirm-error]
		 * @param [delm] - элемент html в тексте которого сообщение будет продублировано
		 * @example
		 *  $p.msg.show_msg({
		 *      title:"Important!",
		 *      type:"alert-error",
		 *      text:"Error"});
		 */
		this.show_msg = function(attr, delm){
			if(!attr)
				return;
			if(typeof attr == "string"){
				if($p.iface.synctxt){
					$p.iface.synctxt.show_message(attr);
					return;
				}
				attr = {type:"info", text:attr };
			}
			if(delm && typeof delm.setText == "function")
				delm.setText(attr.text);
			dhtmlx.message(attr);
		};

		/**
		 * Проверяет корректность ответа сервера
		 * @method check_soap_result
		 * @for Messages
		 * @param res {XMLHttpRequest|Object} - полученный с сервера xhr response
		 * @return {boolean} - true, если нет ошибки
		 */
		this.check_soap_result = function(res){
			if(!res){
				$p.msg.show_msg({
					type: "alert-error",
					text: $p.msg.empty_response,
					title: $p.msg.error_critical});
				return true;

			}else if(res.error=="limit_query"){
				$p.iface.docs.progressOff();
				$p.msg.show_msg({
					type: "alert-warning",
					text: $p.msg.limit_query.replace("%1", res["queries"]).replace("%2", res["queries_avalable"]),
					title: $p.msg.srv_overload});
				return true;

			}else if(res.error=="network" || res.error=="empty"){
				$p.iface.docs.progressOff();
				$p.msg.show_msg({
					type: "alert-warning",
					text: $p.msg.error_network,
					title: $p.msg.error_critical});
				return true;

			}else if(res.error && res.error_description){
				$p.iface.docs.progressOff();
				if(res.error_description.indexOf("Недостаточно прав") != -1){
					res["error_type"] = "alert-warning";
					res["error_title"] = $p.msg.error_rights;
				}
				$p.msg.show_msg({
					type: res["error_type"] || "alert-error",
					text: res.error_description,
					title: res["error_title"] || $p.msg.error_critical
				});
				return true;

			}else if(res.error && !res.messages){
				$p.iface.docs.progressOff();
				$p.msg.show_msg({
					type: "alert-error",
					title: $p.msg.error_critical,
					text: $p.msg.unknown_error.replace("%1", "unknown_error")
				});
				return true;
			}

		};

		/**
		 * Показывает модальное сообщение о нереализованной функциональности
		 * @method show_not_implemented
		 * @for Messages
		 */
		this.show_not_implemented = function(){
			$p.msg.show_msg({type: "alert-warning",
				text: $p.msg.not_implemented,
				title: $p.msg.main_title});
		};

	}
};

/**
 * Объекты интерфейса пользователя
 * @class InterfaceObjs
 * @static
 */
function InterfaceObjs(){

	this.toString = function(){return "Объекты интерфейса пользователя"};

	/**
	 * Очищает область (например, удаляет из div все дочерние элементы)
	 * @method clear_svgs
	 * @param area {HTMLElement|String}
	 */
	this.clear_svgs = function(area){
		if(typeof area === "string")
			area = document.getElementById(area);
		while (area.firstChild)
			area.removeChild(area.firstChild);
	};

	/**
	 * Устанавливает hash url для сохранения истории и последующей навигации
	 * @method set_hash
	 * @param [obj] {String} - имя класса объекта
	 * @param [ref] {String} - ссылка объекта
	 * @param [frm] {String} - имя формы объекта
	 * @param [view] {String} - имя представления главной формы
	 */
	this.set_hash = function (obj, ref, frm, view ) {
		if(!obj)
			obj = "";
		if(!ref)
			ref = "";
		if(!frm)
			frm = "";
		if(!view)
			view = "";
		var hash = "obj=" + obj + "&ref=" + ref + "&frm=" + frm + "&view=" + view;

		if(location.hash.substr(1) == hash)
			this.hash_route();
		else
			location.hash = hash;
	};

	/**
	 * Выполняет навигацию при изменении хеша url
	 * @method hash_route
	 * @param event {HashChangeEvent}
	 * @return {Boolean}
	 */
	this.hash_route = function (event) {

		if(!$p.iface.before_route || $p.iface.before_route(event)!==false){

			if($p.ajax.authorized){

				var hprm = $p.job_prm.parse_url(), mgr;

				if(hprm.ref && typeof _md != "undefined"){
					// если задана ссылка, открываем форму объекта
					mgr = _md.mgr_by_class_name(hprm.obj);
					if(mgr)
						mgr[hprm.frm || "form_obj"]($p.iface.docs, hprm.ref)

				}else if(hprm.view && $p.iface.swith_view){
					// если задано имя представления, переключаем главную форму
					$p.iface.swith_view(hprm.view);

				}

			}
		}

		if(event)
			return $p.cancel_bubble(event);
	};

	/**
	 * Возникает после готовности DOM. Должен быть обработан конструктором основной формы приложения
	 * @event oninit
	 */
	this.oninit = null;

	/**
	 * Обновляет формы интерфейса пользователя раз в полторы минуты
	 * @event ontimer
	 */
	this.ontimer = null;
	setTimeout(function () {
		if($p.iface.ontimer && typeof $p.iface.ontimer === "function"){
			setInterval($p.iface.ontimer, 90000);
		}
	}, 20000);

}

/**
 * Объекты интерфейса пользователя
 * @property iface
 * @type InterfaceObjs
 * @static
 */
$p.iface = new InterfaceObjs();

/**
 * Обработчики событий приложения
 * Подробнее см. класс {{#crossLink "AppEvents"}}{{/crossLink}} и модуль {{#crossLinkModule "events"}}{{/crossLinkModule}}
 * @property eve
 * @for MetaEngine
 * @type AppEvents
 * @static
 */
$p.eve = new (
	/**
	 * Обработчики событий:
	 * - при запуске программы
	 * - при авторизации и начальной синхронизации с сервером
	 * - при периодических обменах изменениями с сервером
	 * См. так же модуль {{#crossLinkModule "events"}}{{/crossLinkModule}}
	 * @class AppEvents
	 * @static
	 */
	function AppEvents(){

		this.toString = function(){return "События при начале работы программы"};

		// Модули при загрузке могут добавлять в этот массив свои функции, которые будут выполнены после готовности документа
		this.onload = [];
	}
);

/**
 * Модификаторы менеджеров объектов метаданных {{#crossLink "Modifiers"}}{{/crossLink}}
 * @property modifiers
 * @for MetaEngine
 * @type {Modifiers}
 * @static
 */
$p.modifiers = new (
	/**
	 * Модификаторы менеджеров объектов метаданных<br />
	 * Служебный объект, реализующий отложенную загрузку модулей, в которых доопределяется (переопределяется) поведение
	 * объектов и менеджеров конкретных типов
	 * Т.к. экземпляры менеджеров и конструкторы объектов доступны в системе только посл загрузки метаданных,
	 * а метаданные загружаются после авторизации на сервере, методы модификаторов нельзя выполнить при старте приложения
	 * @class Modifiers
	 * @static
	 */
	function Modifiers(){

		var methods = [];

		/**
		 * Добавляет метод в коллекцию методов для отложенного вызова
		 * @method push
		 * @param method {function} - функция, которая будет вызвана после инициализации менеджеров объектов данных
		 */
		this.push = function (method) {
			methods.push(method);
		};

		/**
		 * Загружает и выполняет методы модификаторов
		 * @method execute
		 */
		this.execute = function () {
			methods.forEach(function (method) {
				if(typeof method === "function")
					method($p);
				else
					require(method)($p);
			});
		}

	}
);

/**
 * Хранит глобальные настройки варианта компиляции (Заказ дилера, Безбумажка, Демо и т.д.)
 * Настройки извлекаются из файла "settings" при запуске приложения и дополняются параметрами url,
 * которые могут быть переданы как через search (?), так и через hash (#)
 * @class JobPrm
 * @static
 */
function JobPrm(){

	/**
	 * Осуществляет синтаксический разбор параметров url
	 * @method parse_url
	 * @return {Object}
	 */
	this.parse_url = function (){

		function parse(url_prm){
			var prm = {}, tmp = [], pairs;

			if(url_prm.substr(0, 1) === "#" || url_prm.substr(0, 1) === "?")
				url_prm = url_prm.substr(1);

			if(url_prm.length > 2){

				pairs = decodeURI(url_prm).split('&');

				// берём параметры из url
				for (var i in pairs){   //разбиваем пару на ключ и значение, добавляем в их объект
					tmp = pairs[i].split('=');
					if(tmp[0] == "m"){
						try{
							prm[tmp[0]] = JSON.parse(tmp[1]);
						}catch(e){
							prm[tmp[0]] = {};
						}
					}else
						prm[tmp[0]] = tmp[1] || "";
				}
			}

			return prm;
		}

		return parse(location.search)._mixin(parse(location.hash));
	};


	/**
	 * Указывает, проверять ли совместимость браузера при запуске программы
	 * @property check_browser_compatibility
	 * @type {Boolean}
	 * @static
	 */
	this.check_browser_compatibility = true;

	/**
	 * Указывает, проверять ли установленность приложения в Google Chrome Store при запуске программы
	 * @property check_app_installed
	 * @type {Boolean}
	 * @static
	 */
	this.check_app_installed = false;
	this.check_dhtmlx = true;
	this.use_builder = false;
	this.offline = false;

	/**
	 * Содержит объект с расшифровкой параметров url, указанных при запуске программы
	 * @property url_prm
	 * @type {Object}
	 * @static
	 */
	this.url_prm = this.parse_url();

	// подмешиваем параметры, заданные в файле настроек сборки
	if(typeof $p.settings === "function")
		$p.settings(this, $p.modifiers);

	// подмешиваем параметры url
	// Они обладают приоритетом над настройками по умолчанию и настройками из settings.js
	for(var prm_name in this){
		if(prm_name !== "url_prm" && typeof this[prm_name] !== "function" && this.url_prm.hasOwnProperty[prm_name])
			this[prm_name] = this.url_prm[prm_name];
	}

	this.hs_url = function () {
		var url = this.hs_path || "/a/zd/%1/hs/upzp",
			zone = $p.wsql.get_user_param("zone", "number");
		if(zone)
			return url.replace("%1", zone);
		else
			return url.replace("%1/", "");
	};

	this.rest_url = function () {
		var url = this.rest_path || "/a/zd/%1/odata/standard.odata/",
			zone = $p.wsql.get_user_param("zone", "number");
		if(zone)
			return url.replace("%1", zone);
		else
			return url.replace("%1/", "");
	};

	this.irest_url = function () {
		var url = this.rest_path || "/a/zd/%1/odata/standard.odata/",
			zone = $p.wsql.get_user_param("zone", "number");
		url = url.replace("odata/standard.odata", "hs/rest")
		if(zone)
			return url.replace("%1", zone);
		else
			return url.replace("%1/", "");
	};

	this.unf_url = function () {
		return "/a/unf/%1/odata/standard.odata/".replace("%1", $p.wsql.get_user_param("zone_unf", "number"));
	}

}


/**
 * Интерфейс локальной базы данных
 * @class WSQL
 * @static
 */
function WSQL(){};

/**
 * Интерфейс локальной базы данных
 * @property wsql
 * @for MetaEngine
 * @type WSQL
 * @static
 */
$p.wsql = WSQL;

(function (wsql) {

	var user_params = {},
		inited = 0;



	if(typeof alasql !== "undefined")
		wsql.aladb = new alasql.Database('md');
	else
		inited = 1000;

	function fetch_type(prm, type){
		if(type == "object")
			return prm ? $p.fix_guid(JSON.parse(prm)) : {};
		else if(type == "number")
			return $p.fix_number(prm, true);
		else if(type == "date")
			return $p.fix_date(prm, true);
		else if(type == "boolean")
			return $p.fix_boolean(prm);
		else
			return prm;
	}

	//TODO задействовать вебворкеров + единообразно база в озу alasql


	/**
	 * Выполняет sql запрос к локальной базе данных
	 * @method exec
	 * @for WSQL
	 * @param sql {String} - текст запроса
	 * @param prm {Array} - массив с параметрами для передачи в запрос
	 * @param [callback] {function} - функция обратного вызова. если не укзана, запрос выполняется "как бы синхронно"
	 * @param [tag] {any} - произвольные данные для передачи в callback
	 * @async
	 */
	wsql.exec = function(sql, prm, callback, tag) {

		if(inited < 10){
			inited++;
			setTimeout(function () {
				wsql.exec(sql, prm, callback, tag);
			}, 1000);
			return;

		}else if(inited < 100) {
			throw new TypeError('alasql init error');
		}

		if(!Array.isArray(prm))
			prm = [prm];	// если параметры не являются массивом, конвертируем

		var i, data = [];
		try{
			if(callback)
				alasql(sql, prm, function (data) {
					callback(data, tag);
				});
			else
				alasql(sql, prm);
		}
		catch(e){
			if(callback)
				callback(e);
		}
	};

	/**
	 * Выполняет sql запрос к локальной базе данных, возвращает Promise
	 * @param sql
	 * @param params
	 * @return {Promise.<T>}
	 */
	wsql.promise = function(sql, params) {
		return new Promise(function(resolve, reject){
			alasql(sql, params, function(data, err) {
				if(err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	};

	/**
	 * Устанавливает параметр в user_params и базе данных
	 * @method set_user_param
	 * @for WSQL
	 * @param prm_name {string} - имя параметра
	 * @param prm_value {string|number|object|boolean} - значение
	 * @param [callback] {function} - вызывается после установки параметра
	 */
	wsql.set_user_param = function(prm_name, prm_value, callback){

		var str_prm = prm_value;
		if(typeof prm_value == "object")
			str_prm = JSON.stringify(prm_value);

		else if(prm_value === false)
			str_prm = "";

		if(typeof localStorage !== "undefined")
			localStorage.setItem(prm_name, str_prm);
		user_params[prm_name] = prm_value;

		if(callback)
			callback([]);
	};

	/**
	 * Возвращает значение сохраненного параметра
	 * @method get_user_param
	 * @param prm_name {String} - имя параметра
	 * @param [type] {String} - имя типа параметра. Если указано, выполняем приведение типов
	 * @return {*} - значение параметра
	 */
	wsql.get_user_param = function(prm_name, type){

		if(!user_params.hasOwnProperty(prm_name) && (typeof localStorage !== "undefined"))
			user_params[prm_name] = fetch_type(localStorage.getItem(prm_name), type);

		return user_params[prm_name];
	};

	wsql.save_options = function(prefix, options){
		wsql.set_user_param(prefix + "_" + options.name, options);
	};

	wsql.restore_options = function(prefix, options){
		var options_saved = wsql.get_user_param(prefix + "_" + options.name, "object");
		for(var i in options_saved){
			if(typeof options_saved[i] != "object")
				options[i] = options_saved[i];
			else{
				if(!options[i])
					options[i] = {};
				for(var j in options_saved[i])
					options[i][j] = options_saved[i][j];
			}
		}
		return options;
	};

	/**
	 * Создаёт и заполняет умолчаниями таблицу параметров
	 * @method init_params
	 * @param [callback] {function} - вызывается после создания и заполнения значениями по умолчанию таблицы параметров
	 * @async
	 */
	wsql.init_params = function(callback){

		var nesessery_params = [
			{p: "user_name",		v: "", t:"string"},
			{p: "user_pwd",			v: "", t:"string"},
			{p: "browser_uid",		v: $p.generate_guid(), t:"string"},
			{p: "zone",             v: $p.job_prm.hasOwnProperty("zone") ? $p.job_prm.zone : 1, t:"number"},
			{p: "zone_unf",         v: 1, t:"number"},
			{p: "phantom_url",		v: "/p/", t:"string"},
			{p: "enable_save_pwd",	v: "",	t:"boolean"},
			{p: "reset_local_data",	v: "",	t:"boolean"},
			{p: "autologin",		v: "",	t:"boolean"},
			{p: "cache_md_date",	v: 0,	t:"number"},
			{p: "cache_cat_date",	v: 0,	t:"number"},
			{p: "files_date",       v: 201506140000,	t:"number"},
			{p: "margin",			v: 60,	t:"number"},
			{p: "discount",			v: 15,	t:"number"},
			{p: "offline",			v: "" || $p.job_prm.offline, t:"boolean"}
		], zone;

		// подмешиваем к базовым параметрам настройки приложения
		if($p.job_prm.additionsl_params)
			nesessery_params = nesessery_params.concat($p.job_prm.additionsl_params);

		// дополняем хранилище недостающими параметрами
		nesessery_params.forEach(function(o){
			if(wsql.get_user_param(o.p, o.t) == undefined ||
					(!wsql.get_user_param(o.p, o.t) && (o.p.indexOf("url") != -1 || o.p.indexOf("zone") != -1)))
				wsql.set_user_param(o.p, o.v);
		});

		// сбрасываем даты, т.к. база в озу
		wsql.set_user_param("cache_md_date", 0);
		wsql.set_user_param("cache_cat_date", 0);
		wsql.set_user_param("reset_local_data", "");

		// если зона указана в url, используем её
		if($p.job_prm.url_prm.hasOwnProperty("zone")){
			zone = $p.fix_number($p.job_prm.url_prm.zone, true);

		// если зона не указана, устанавливаем "1"
		}else if(!localStorage.getItem("zone"))
			zone = 1;

		if(zone)
			wsql.set_user_param("zone", zone);

		if(typeof alasql !== "undefined"){
			if($p.job_prm.create_tables){
				if($p.job_prm.create_tables_sql)
					alasql($p.job_prm.create_tables_sql, [], function(){
						inited = 1000;
						delete $p.job_prm.create_tables_sql;
						callback([]);
					});
				else
					$p.ajax.get($p.job_prm.create_tables)
						.then(function (req) {
							alasql(req.response, [], function(){
								inited = 1000;
								callback([]);
							});
						});
			}else
				callback([]);
		}else
			callback([]);

	};

	/**
	 * Удаляет таблицы WSQL. Например, для последующего пересоздания при изменении структуры данных
	 * @method drop_tables
	 * @param callback {function}
	 * @async
	 */
	wsql.drop_tables = function(callback){
		var cstep = 0, tmames = [];

		function ccallback(){
			cstep--;
			if(cstep<=0)
				setTimeout(callback, 10);
			else
				iteration();
		}

		function iteration(){
			var tname = tmames[cstep-1]["tableid"];
			if(tname.substr(0, 1) == "_")
				ccallback();
			else
				alasql("drop table IF EXISTS " + tname, [], ccallback);
		}

		function tmames_finded(data){
			tmames = data;
			if(cstep = data.length)
				iteration();
			else
				ccallback();
		}

		alasql("SHOW TABLES", [], tmames_finded);
	};

	wsql.dump = function(callback){
		var cstep = 0, tmames = [], create = "", insert = "";

		function tmames_finded(data){
			data.forEach(function (tname) {
				create += alasql("show create table " + tname["tableid"]) + ";\n";
			});

			console.log(create);
			setTimeout(callback, 10);
		}

		$p.wsql.exec("SHOW TABLES", [], tmames_finded);
	};

	wsql.toString = function(){return "JavaScript SQL engine"};

})($p.wsql);

/**
 * Строковые константы интернационализации
 * @module common
 * @submodule i18n
 */

var msg = $p.msg;

/**
 * русификация dateFormat
 */
$p.dateFormat.i18n = {
	dayNames: [
		"Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб",
		"Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"
	],
	monthNames: [
		"Янв", "Фев", "Maр", "Aпр", "Maй", "Июн", "Июл", "Aвг", "Сен", "Окт", "Ноя", "Дек",
		"Январь", "Февраль", "Март", "Апрель", "Maй", "Июнь", "Июль", "Август", "Сентябрь", "Oктябрь", "Ноябрь", "Декабрь"
	]
};

if(typeof window !== "undefined" && "dhx4" in window){
	dhx4.dateFormat.ru = "%d.%m.%Y";
	dhx4.dateLang = "ru";
	dhx4.dateStrings = {
		ru: {
			monthFullName:	["Январь","Февраль","Март","Апрель","Maй","Июнь","Июль","Август","Сентябрь","Oктябрь","Ноябрь","Декабрь"],
			monthShortName:	["Янв","Фев","Maр","Aпр","Maй","Июн","Июл","Aвг","Сен","Окт","Ноя","Дек"],
			dayFullName:	["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"],
			dayShortName:	["Вс","Пн","Вт","Ср","Чт","Пт","Сб"]
		}
	};
}


/**
 *  строки ФИАС адресного классификатора
 */
$p.fias = function FIAS(){};
(function (fias){

	fias.toString = function(){return "Коды адресного классификатора"};

	fias.types = ["владение", "здание", "помещение"];

	// Код, Наименование, Тип, Порядок, КодФИАС
	fias["1010"] = {name: "дом",			type: 1, order: 1, fid: 2, syn: [" д.", " д ", " дом"]};
	fias["1020"] = {name: "владение",		type: 1, order: 2, fid: 1, syn: [" вл.", " вл ", " влад.", " влад ", " владен.", " владен ", " владение"]};
	fias["1030"] = {name: "домовладение",	type: 1, order: 3, fid: 3};

	fias["1050"] = {name: "корпус",		type: 2, order: 1, syn: [" к.", " к ", " корп.", " корп ", "корпус"]};
	fias["1060"] = {name: "строение",	type: 2, order: 2, fid: 1, syn: [" стр.", " стр ", " строен.", " строен ", "строение"]};
	fias["1080"] = {name: "литера",		type: 2, order: 3, fid: 3, syn: [" л.", " л ", " лит.", " лит ", "литера"]};
	fias["1070"] = {name: "сооружение",	type: 2, order: 4, fid: 2, syn: [" соор.", " соор ", " сооруж.", " сооруж ", "сооружение"]};
	fias["1040"] = {name: "участок",	type: 2, order: 5, syn: [" уч.", " уч ", "участок"]};

	fias["2010"] = {name: "квартира",	type: 3, order: 1, syn: ["кв.", "кв ", "кварт.", "кварт ", "квартира", "-"]};
	fias["2030"] = {name: "офис",		type: 3, order: 2, syn: ["оф.", "оф ", "офис", "-"]};
	fias["2040"] = {name: "бокс",		type: 3, order: 3};
	fias["2020"] = {name: "помещение",	type: 3, order: 4};
	fias["2050"] = {name: "комната",	type: 3, order: 5, syn: ["комн.", "комн ", "комната"]};

	//	//  сокращения 1C для поддержки обратной совместимости при парсинге
	//	fias["2010"] = {name: "кв.",	type: 3, order: 6};
	//	fias["2030"] = {name: "оф.",	type: 3, order: 7};

	// Уточняющие объекты
	fias["10100000"] = {name: "Почтовый индекс"};
	fias["10200000"] = {name: "Адресная точка"};
	fias["10300000"] = {name: "Садовое товарищество"};
	fias["10400000"] = {name: "Элемент улично-дорожной сети, планировочной структуры дополнительного адресного элемента"};
	fias["10500000"] = {name: "Промышленная зона"};
	fias["10600000"] = {name: "Гаражно-строительный кооператив"};
	fias["10700000"] = {name: "Территория"};

})($p.fias);


// публичные методы, экспортируемые, как свойства $p.msg
msg.store_url_od = "https://chrome.google.com/webstore/detail/hcncallbdlondnoadgjomnhifopfaage";

msg.align_node_right = "Уравнять вертикально вправо";
msg.align_node_bottom = "Уравнять горизонтально вниз";
msg.align_node_top = "Уравнять горизонтально вверх";
msg.align_node_left = "Уравнять вертикально влево";
msg.align_set_right = "Установить размер сдвигом вправо";
msg.align_set_bottom = "Установить размер сдвигом вниз";
msg.align_set_top = "Установить размер сдвигом вверх";
msg.align_set_left = "Установить размер сдвигом влево";
msg.align_invalid_direction = "Неприменимо для элемента с данной ориентацией";

msg.argument_is_not_ref = "Аргумент не является ссылкой";
msg.addr_title = "Ввод адреса";

msg.cache_update_title = "Обновление кеша браузера";
msg.cache_update = "Выполняется загрузка измененных файлов<br/>и их кеширование в хранилище браузера";
msg.delivery_area_empty = "Укажите район доставки";
msg.empty_login_password = "Не указаны имя пользователя или пароль";
msg.empty_response = "Пустой ответ сервера";
msg.empty_geocoding = "Пустой ответ геокодера. Вероятно, отслеживание адреса запрещено в настройках браузера";

msg.error_auth = "Авторизация пользователя не выполнена";
msg.error_critical = "Критическая ошибка";
msg.error_metadata = "Ошибка загрузки метаданных конфигурации";
msg.error_network = "Ошибка сети или сервера - запрос отклонен";
msg.error_rights = "Ограничение доступа";

msg.file_size = "Запрещена загрузка файлов<br/>размером более ";
msg.file_confirm_delete = "Подтвердите удаление файла ";
msg.file_new_date = "Файлы на сервере обновлены<br /> Рекомендуется закрыть браузер и войти<br />повторно для применения обновления";
msg.file_new_date_title = "Версия файлов";

msg.init_catalogues = "Загрузка справочников с сервера";
msg.init_catalogues_meta = ": Метаданные объектов";
msg.init_catalogues_tables = ": Реструктуризация таблиц";
msg.init_catalogues_nom = ": Базовые типы + номенклатура";
msg.init_catalogues_sys = ": Технологические справочники";
msg.init_login = "Укажите имя пользователя и пароль";
msg.requery = "Повторите попытку через 1-2 минуты";
msg.limit_query = "Превышено число обращений к серверу<br/>Запросов за минуту:%1<br/>Лимит запросов:%2<br/>" + msg.requery;
msg.main_title = "Окнософт: заказ дилера ";
msg.meta_cat = "Справочники";
msg.meta_doc = "Документы";
msg.meta_cch = "Планы видов характеристик";
msg.meta_cacc = "Планы счетов";
msg.meta_ireg = "Регистры сведений";
msg.meta_areg = "Регистры накопления";
msg.meta_mgr = "Менеджер";
msg.meta_cat_mgr = "Менеджер справочников";
msg.meta_doc_mgr = "Менеджер документов";
msg.meta_enn_mgr = "Менеджер перечислений";
msg.meta_ireg_mgr = "Менеджер регистров сведений";
msg.meta_areg_mgr = "Менеджер регистров накопления";
msg.meta_accreg_mgr = "Менеджер регистров бухгалтерии";
msg.meta_dp_mgr = "Менеджер обработок";
msg.meta_reports_mgr = "Менеджер отчетов";
msg.meta_charts_of_accounts_mgr = "Менеджер планов счетов";
msg.meta_charts_of_characteristic_mgr = "Менеджер планов видов характеристик";
msg.meta_extender = "Модификаторы объектов и менеджеров";
msg.no_metadata = "Не найдены метаданные объекта '%1'";
msg.no_selected_row = "Не выбрана строка табличной части '%1'";
msg.no_dhtmlx = "Библиотека dhtmlx не загружена";
msg.not_implemented = "Не реализовано в текущей версии";
msg.offline_request = "Запрос к серверу в автономном режиме";
msg.onbeforeunload = "Окнософт: легкий клиент. Закрыть программу?";
msg.order_sent_title = "Подтвердите отправку заказа";
msg.order_sent_message = "Отправленный заказ нельзя изменить.<br/>После проверки менеджером<br/>он будет запущен в работу";
msg.request_title = "Окнософт: Запрос регистрации";
msg.request_message = "Заявка зарегистрирована. После обработки менеджером будет сформировано ответное письмо";
msg.srv_overload = "Сервер перегружен";
msg.sub_row_change_disabled = "Текущая строка подчинена продукции.<br/>Строку нельзя изменить-удалить в документе<br/>только через построитель";
msg.long_operation = "Длительная операция";
msg.sync_script = "Обновление скриптов приложения:";
msg.sync_data = "Синхронизация с сервером выполняется:<br />* при первом старте программы<br /> * при обновлении метаданных<br /> * при изменении цен или технологических справочников";
msg.sync_break = "Прервать синхронизацию";
msg.unsupported_browser_title = "Браузер не поддерживается";
msg.unsupported_browser = "Несовместимая версия браузера<br/>Рекомендуется Google Chrome";
msg.supported_browsers = "Рекомендуется Chrome, Safari или Opera";
msg.unsupported_mode_title = "Режим не поддерживается";
msg.unsupported_mode = "Программа не установлена<br/> в <a href='" + msg.store_url_od + "'>приложениях Google Chrome</a>";
msg.unknown_error = "Неизвестная ошибка в функции '%1'";



msg.bld_constructor = "Конструктор объектов графического построителя";
msg.bld_title = "Графический построитель";
msg.bld_empty_param = "Не заполнен обязательный параметр <br />";
msg.bld_not_product = "В текущей строке нет изделия построителя";
msg.bld_not_draw = "Отсутствует эскиз или не указана система профилей";
msg.bld_wnd_title = "Построитель изделия № ";
msg.bld_from_blocks_title = "Выбор типового блока";
msg.bld_from_blocks = "Текущее изделие будет заменено конфигурацией типового блока. Продолжить?";
msg.bld_split_imp = "В параметрах продукции<br />'%1'<br />запрещены незамкнутые контуры<br />" +
	"Для включения деления импостом,<br />установите это свойство в 'Истина'";
/**
 * Метаданные на стороне js: конструкторы, заполнение, кеширование, поиск <br />&copy; http://www.oknosoft.ru 2009-2015
 * @module  metadata
 * @submodule meta_meta
 * @author	Evgeniy Malyarov
 * @requires common
 */

/**
 * Проверяет, является ли значенние Data-объектным типом
 * @method is_data_obj
 * @for MetaEngine
 * @param v {*} - проверяемое значение
 * @return {Boolean} - true, если значение является ссылкой
 */
$p.is_data_obj = function(v){
	return v && v instanceof DataObj};

/**
 * приводит тип значения v к типу метаданных
 * @method fetch_type
 * @for MetaEngine
 * @param str {any} - значение (обычно, строка, полученная из html поля ввода)
 * @param mtype {Object} - поле type объекта метаданных (field.type)
 * @return {any}
 */
$p.fetch_type = function(str, mtype){
	var v = str;
	if(mtype.is_ref)
		v = $p.fix_guid(str);
	else if(mtype.date_part)
		v = $p.fix_date(str, true);
	else if(mtype["digits"])
		v = $p.fix_number(str, true);
	else if(mtype.types[0]=="boolean")
		v = $p.fix_boolean(str);
	return v;
};


/**
 * Сравнивает на равенство ссылочные типы и примитивные значения
 * @method is_equal
 * @for MetaEngine
 * @param v1 {DataObj|String}
 * @param v2 {DataObj|String}
 * @return {boolean} - true, если значенния эквивалентны
 */
$p.is_equal = function(v1, v2){

	if(v1 == v2)
		return true;
	else if(typeof v1 === typeof v2)
		return false;

	return ($p.fix_guid(v1, false) == $p.fix_guid(v2, false));
};

/**
 * Абстрактный поиск значения в коллекции
 * @method _find
 * @for MetaEngine
 * @param a {Array}
 * @param val {DataObj|String}
 * @return {any}
 * @private
 */
$p._find = function(a, val){
	//TODO переписать с учетом html5 свойств массивов
	var o, i, finded;
	if(typeof val != "object"){
		for(i in a){ // ищем по всем полям объекта
			o = a[i];
			for(var j in o){
				if(typeof o[j] !== "function" && $p.is_equal(o[j], val))
					return o;
			}
		}
	}else{
		for(i in a){ // ищем по ключам из val
			o = a[i];
			finded = true;
			for(var j in val){
				if(typeof o[j] !== "function" && !$p.is_equal(o[j], val[j])){
					finded = false;
					break;
				}
			}
			if(finded)
				return o;
		}
	}
};

/**
 * Абстрактный поиск массива значений в коллекции
 * @method _find_rows
 * @for MetaEngine
 * @param a {Array}
 * @param attr {object}
 * @param fn {function}
 * @return {Array}
 * @private
 */
$p._find_rows = function(a, attr, fn){
	var ok, o, i, j, res = [];
	for(i in a){
		o = a[i];
		ok = true;
		if(attr)
			for(j in attr)
				if(!$p.is_equal(o[j], attr[j])){
					ok = false;
					break;
				}
		if(ok){
			if(fn){
				if(fn.call(this, o) === false)
					break;
			}else
				res.push(o);
		}
	}
	return res;
};

/**
 * Абстрактный запрос к soap или базе WSQL
 * @param method
 * @param attr
 * @param async
 * @param callback
 * @private
 */
function _load(attr){

	var mgr = _md.mgr_by_class_name(attr.class_name), res_local;

	function get_tree(){
		var xml = "<?xml version='1.0' encoding='UTF-8'?><tree id=\"0\">";

		function add_hierarchically(row, adata){
			xml = xml + "<item text=\"" +
				row.presentation.replace(/"/g, "'") +	"\" id=\"" +
				row.ref + "\" im0=\"folderClosed.gif\">";
			$p._find_rows(adata, {parent: row.ref}, function(r){
				add_hierarchically(r, adata)
			});
			xml = xml + "</item>";
		}

		if(mgr._cachable){
			return $p.wsql.promise(mgr.get_sql_struct(attr), [])
				.then(function(data){
					add_hierarchically({presentation: "...", ref: $p.blank.guid}, []);
					$p._find_rows(data, {parent: $p.blank.guid}, function(r){
						add_hierarchically(r, data)
					});
					return xml + "</tree>";
				});
		}
	}

	function get_orders(){

	}

	function get_selection(){

		if(mgr._cachable){

			return $p.wsql.promise(mgr.get_sql_struct(attr), [])
				.then(function(data){
					return data_to_grid.call(mgr, data, attr);
				});
		}
	}


	if(attr.action == "get_tree" && (res_local = get_tree()))
		return res_local;
	else if(attr.action == "get_orders" && (res_local = get_orders()))
		return res_local;
	else if(attr.action == "get_selection" && (res_local = get_selection()))
		return res_local;
	else if($p.job_prm.offline)
		return Promise.reject(Error($p.msg.offline_request));

	attr.browser_uid = $p.wsql.get_user_param("browser_uid");

	return $p.ajax.post_ex($p.job_prm.hs_url(), JSON.stringify(attr), true)
		.then(function (req) {
			return req.response;
		});
}


/**
 * Коллекция менеджеров справочников
 * @property cat
 * @type Catalogs
 * @for MetaEngine
 * @static
 */
var _cat = $p.cat = new (
		/**
		 * Коллекция менеджеров справочников
		 *
		 * Состав коллекции определяется метаданными используемой конфигурации
		 * @class Catalogs
		 * @static
		 */
		function Catalogs(){
			this.toString = function(){return $p.msg.meta_cat_mgr};
		}
	),

	/**
	 * Коллекция менеджеров перечислений
	 * @property enm
	 * @type Enumerations
	 * @for MetaEngine
	 * @static
	 */
	_enm = $p.enm = new (
		/**
		 * Коллекция менеджеров перечислений
		 *
		 * Состав коллекции определяется метаданными используемой конфигурации
		 * @class Enumerations
		 * @static
		 */
		function Enumerations(){
			this.toString = function(){return $p.msg.meta_enn_mgr};
	}),

	/**
	 * Коллекция менеджеров документов
	 * @property doc
	 * @type Documents
	 * @for MetaEngine
	 * @static
	 */
	_doc = $p.doc = new (
		/**
		 * Коллекция менеджеров документов
		 *
		 * Состав коллекции определяется метаданными используемой конфигурации
		 * @class Documents
		 * @static
		 */
		function Documents(){
			this.toString = function(){return $p.msg.meta_doc_mgr};
	}),

	/**
	 * Коллекция менеджеров регистров сведений
	 * @property ireg
	 * @type InfoRegs
	 * @for MetaEngine
	 * @static
	 */
	_ireg = $p.ireg = new (
		/**
		 * Коллекция менеджеров регистров сведений
		 *
		 * Состав коллекции определяется метаданными используемой конфигурации
		 * @class InfoRegs
		 * @static
		 */
		function InfoRegs(){
			this.toString = function(){return $p.msg.meta_ireg_mgr};
	}),

	/**
	 * Коллекция менеджеров регистров накопления
	 * @property areg
	 * @type AccumRegs
	 * @for MetaEngine
	 * @static
	 */
	_areg = $p.areg = new (
		/**
		 * Коллекция менеджеров регистров накопления
		 *
		 * Состав коллекции определяется метаданными используемой конфигурации
		 * @class AccumRegs
		 * @static
		 */
		function AccumRegs(){
			this.toString = function(){return $p.msg.meta_areg_mgr};
	}),

	/**
	 * Коллекция менеджеров регистров бухгалтерии
	 * @property aссreg
	 * @type AccountsRegs
	 * @for MetaEngine
	 * @static
	 */
	_aссreg = $p.aссreg = new (
		/**
		 * Коллекция менеджеров регистров бухгалтерии
		 *
		 * Состав коллекции определяется метаданными используемой конфигурации
		 * @class AccountsRegs
		 * @static
		 */
			function AccountsRegs(){
			this.toString = function(){return $p.msg.meta_accreg_mgr};
		}),

	/**
	 * Коллекция менеджеров обработок
	 * @property dp
	 * @type DataProcessors
	 * @for MetaEngine
	 * @static
	 */
	_dp	= $p.dp = new (
		/**
		 * Коллекция менеджеров обработок
		 *
		 * Состав коллекции определяется метаданными используемой конфигурации
		 * @class DataProcessors
		 * @static
		 */
		function DataProcessors(){
			this.toString = function(){return $p.msg.meta_dp_mgr};
	}),

	/**
	 * Коллекция менеджеров отчетов
	 * @property rep
	 * @type Reports
	 * @for MetaEngine
	 * @static
	 */
	_rep = $p.rep = new (
		/**
		 * Коллекция менеджеров отчетов
		 *
		 * Состав коллекции определяется метаданными используемой конфигурации
		 * @class Reports
		 * @static
		 */
		function Reports(){
			this.toString = function(){return $p.msg.meta_reports_mgr};
	}),

	/**
	 * Коллекция менеджеров планов счетов
	 * @property cacc
	 * @type ChartsOfAccounts
	 * @for MetaEngine
	 * @static
	 */
	_cacc = $p.cacc = new (

		/**
		 * Коллекция менеджеров планов счетов
		 *
		 * Состав коллекции определяется метаданными используемой конфигурации
		 * @class ChartsOfAccounts
		 * @static
		 */
			function ChartsOfAccounts(){
			this.toString = function(){return $p.msg.meta_charts_of_accounts_mgr};
		}),

	/**
	 * Коллекция менеджеров планов видов характеристик
	 * @property cch
	 * @type ChartsOfCharacteristic
	 * @for MetaEngine
	 * @static
	 */
	_cch = $p.cch = new (

		/**
		 * Коллекция менеджеров планов видов характеристик
		 *
		 * Состав коллекции определяется метаданными используемой конфигурации
		 * @class ChartsOfCharacteristics
		 * @static
		 */
			function ChartsOfCharacteristics(){
			this.toString = function(){return $p.msg.meta_charts_of_characteristic_mgr};
		}),

	/**
	 * Mетаданные конфигурации
	 */
	_md;


// КОНСТРУКТОРЫ - полная абстракция

/**
 * Хранилище метаданных конфигурации
 * загружает описание из файла на сервере. в оффлайне используется локальный кеш
 * @class Meta
 * @static
 * @param req {XMLHttpRequest} - с основными метаданными
 * @param patch {XMLHttpRequest} - с дополнительными метаданными
 */
function Meta(req, patch) {

	var m = JSON.parse(req.response), class_name;
	if(patch){
		patch = JSON.parse(patch.response);
		for(var area in patch){
			for(var c in patch[area]){
				if(!m[area][c])
					m[area][c] = {};
				m[area][c]._mixin(patch[area][c]);
			}
		}
	}
	req = null;
	patch = null;


	/**
	 * Возвращает описание объекта метаданных
	 * @method get
	 * @param class_name {String} - например, "doc.calc_order"
	 * @param [field_name] {String}
	 * @return {Object}
	 */
	this.get = function(class_name, field_name){
		var np = class_name.split("."),
			res = {multiline_mode: false, note: "", synonym: "", tooltip: "", type: {is_ref: false,	types: ["string"]}};
		if(!field_name)
			return m[np[0]][np[1]];
		if(np[0]=="doc" && field_name=="number_doc"){
			res.synonym = "Номер";
			res.tooltip = "Номер документа";
			res.type.str_len = 11;
		}else if(np[0]=="doc" && field_name=="date"){
			res.synonym = "Дата";
			res.tooltip = "Дата документа";
			res.type.date_part = "date_time";
			res.type.types[0] = "date";
		}else if(np[0]=="doc" && field_name=="posted"){
			res.synonym = "Проведен";
			res.type.types[0] = "boolean";
		}else if(np[0]=="cat" && field_name=="id"){
			res.synonym = "Код";
		}else if(np[0]=="cat" && field_name=="name"){
			res.synonym = "Наименование";
		}else if(field_name=="deleted"){
			res.synonym = "Пометка удаления";
			res.type.types[0] = "boolean";
		}else if(field_name)
			res = m[np[0]][np[1]].fields[field_name];
		else
			res = m[np[0]][np[1]];
		return res;
	};

	/**
	 * Возвращает структуру метаданных конфигурации
	 */
	this.get_classes = function () {
		var res = {};
		for(var i in m){
			res[i] = [];
			for(var j in m[i])
				res[i].push(j);
		}
		return res;
	};

	/**
	 * Создаёт таблицы WSQL для всех объектов метаданных
	 * @method create_tables
	 * @return {Promise.<T>}
	 * @async
	 */
	this.create_tables = function(callback){

		var cstep = 0, data_names = [], managers = this.get_classes(), class_name,
			create = "USE md;\nCREATE TABLE IF NOT EXISTS refs (ref CHAR);\n";

		function on_table_created(data){

			if(typeof data === "number"){
				cstep--;
				if(cstep==0){
					if(callback)
						setTimeout(callback, 10);
					alasql.utils.saveFile("create_tables.sql", create);
				} else
					iteration();
			}else if(data.hasOwnProperty("message")){
				$p.iface.docs.progressOff();
				$p.msg.show_msg({
					title: $p.msg.error_critical,
					type: "alert-error",
					text: data.message
				});
			}


		}

		// TODO переписать на промисах и генераторах и перекинуть в синкер

		for(class_name in managers.cat)
			data_names.push({"class": _cat, "name": managers.cat[class_name]});
		cstep = data_names.length;

		for(class_name in managers.ireg){
			data_names.push({"class": _ireg, "name": managers.ireg[class_name]});
			cstep++;
		}

		for(class_name in managers.doc){
			data_names.push({"class": _doc, "name": managers.doc[class_name]});
			cstep++;
		}

		for(class_name in managers.enm){
			data_names.push({"class": _enm, "name": managers.enm[class_name]});
			cstep++;
		}

		for(class_name in managers.cch){
			data_names.push({"class": _cch, "name": managers.cch[class_name]});
			cstep++;
		}

		for(class_name in managers.cacc){
			data_names.push({"class": _cacc, "name": managers.cacc[class_name]});
			cstep++;
		}

		function iteration(){
			var data = data_names[cstep-1],
				sql = data["class"][data.name].get_sql_struct();

			create += sql + ";\n";
			on_table_created(1);
			//$p.wsql.exec(sql, [], on_table_created);
		}

		$p.wsql.exec(create);
		iteration();

	};

	this.sql_type = function (mgr, f, mf) {
		var sql;
		if((f == "type" && mgr.table_name == "cch_properties") || (f == "svg" && mgr.table_name == "cat_production_params"))
			sql = " JSON";

		else if(mf.is_ref || mf.hasOwnProperty("str_len"))
			sql = " CHAR";

		else if(mf.date_part)
			sql = " Date";

		else if(mf.hasOwnProperty("digits")){
			if(mf.fraction_figits==0)
				sql = " INT";
			else
				sql = " FLOAT";

		}else if(mf.types.indexOf("boolean") != -1)
			sql = " BOOLEAN";

		else
			sql = " CHAR";
		return sql;
	};

	this.sql_mask = function(f, t){
		var mask_names = ["delete", "set", "value", "json", "primary", "content"];
		return ", " + (t ? "_t_." : "") + (mask_names.some(
				function (mask) {
					return f.indexOf(mask) !=-1
				})  ? ("`" + f + "`") : f);
	};

	/**
	 * Возвращает менеджер объекта по имени класса
	 * @param class_name {String}
	 * @return {DataManager|undefined}
	 * @private
	 */
	this.mgr_by_class_name = function(class_name){
		if(class_name){
			var np = class_name.split(".");
			if(np[1] && $p[np[0]])
				return $p[np[0]][np[1]];
		}
	};

	/**
	 * Возвращает менеджер значения по свойству строки
	 * @param row {Object|TabularSectionRow} - строка табчасти или объект
	 * @param f {String} - имя поля
	 * @param mf {Object} - метаданные поля
	 * @param array_enabled {Boolean} - возвращать массив для полей составного типа или первый доступный тип
	 * @param v {*} - устанавливаемое значение
	 * @return {DataManager|Array}
	 */
	this.value_mgr = function(row, f, mf, array_enabled, v){
		var property, oproperty, tnames, rt, mgr;
		if(mf._mgr)
			return mf._mgr;

		function mf_mgr(mgr){
			if(mgr && mf.types.length == 1)
				mf._mgr = mgr;
			return mgr;
		}

		if(mf.types.length == 1){
			tnames = mf.types[0].split(".");
			if(tnames.length > 1 && $p[tnames[0]])
				return mf_mgr($p[tnames[0]][tnames[1]]);
		}else if(v && v.type){
			tnames = v.type.split(".");
			if(tnames.length > 1 && $p[tnames[0]])
				return mf_mgr($p[tnames[0]][tnames[1]]);
		}

		property = row.property || row.param;
		if(f != "value" || !property){
			rt = [];
			mf.types.forEach(function(v){
				tnames = v.split(".");
				if(tnames.length > 1 && $p[tnames[0]][tnames[1]])
					rt.push($p[tnames[0]][tnames[1]]);
			});
			if(rt.length == 1)
				return mf_mgr(rt[0]);

			else if(array_enabled)
				return rt;

			else if((property = row[f]) instanceof DataObj)
				return property._manager;

			else if($p.is_guid(property) && property != $p.blank.guid){
				for(var i in rt){
					mgr = rt[i];
					if(mgr.get(property, false, true))
						return mgr;
				}
			}
		}else{

			// Получаем объект свойства
			oproperty = _cch.properties.get(property, false);
			if($p.is_data_obj(oproperty)){

				if(oproperty.is_new())
					return _cat.property_values;

				// и через его тип выходми на мнеджера значения
				for(rt in oproperty.type.types)
					if(oproperty.type.types[rt].indexOf(".") > -1){
						tnames = oproperty.type.types[rt].split(".");
						break;
					}
				if(tnames && tnames.length > 1 && $p[tnames[0]])
					return mf_mgr($p[tnames[0]][tnames[1]]);
				else
					return oproperty.type;
			}
		}
	};

	this.control_by_type = function (type) {
		var ft;
		if(type.is_ref){
			if(type.types.join().indexOf("enm.")==-1)
				ft = "ref";
			else
				ft = "refc";
		} else if(type.date_part) {
			ft = "dhxCalendar";
		} else if(type["digits"]) {
			if(type.fraction_figits < 5)
				ft = "calck";
			else
				ft = "edn";
		} else if(type.types[0]=="boolean") {
			ft = "ch";
		} else if(type.str_len && type.str_len >= 100) {
			ft = "txt";
		} else {
			ft = "ed";
		}
		return ft;
	};

	this.ts_captions = function (class_name, ts_name, source) {
		if(!source)
			source = {};

		var mts = this.get(class_name).tabular_sections[ts_name],
			mfrm = this.get(class_name).form,
			fields = mts.fields, mf;

		// если имеются метаданные формы, используем их
		if(mfrm && mfrm.obj){

			if(!mfrm.obj.tabular_sections[ts_name])
				return;

			source._mixin(mfrm.obj.tabular_sections[ts_name]);

		}else{

			if(ts_name==="contact_information")
				fields = {type: "", kind: "", presentation: ""}

			source.fields = ["row"];
			source.headers = "№";
			source.widths = "40";
			source.min_widths = "";
			source.aligns = "";
			source.sortings = "na";
			source.types = "cntr";

			for(var f in fields){
				mf = mts.fields[f];
				if(!mf.hide){
					source.fields.push(f);
					source.headers += "," + (mf.synonym ? mf.synonym.replace(/,/g, " ") : f);
					source.types += "," + this.control_by_type(mf.type);
					source.sortings += ",na";
				}
			}
		}

		return true;

	};

	this.syns_js = function (v) {
		var synJS = {
			DeletionMark: 'deleted',
			Description: 'name',
			DataVersion: 'data_version',
			IsFolder: 'is_folder',
			Number: 'number_doc',
			Date: 'date',
			Posted: 'posted',
			Code: 'id'
		};
		if(synJS[v])
			return synJS[v];
		return m.syns_js[m.syns_1с.indexOf(v)] || v;
	};

	this.syns_1с = function (v) {
		var syn1c = {
			deleted: 'DeletionMark',
			name: 'Description',
			data_version: 'DataVersion',
			is_folder: 'IsFolder',
			number_doc: 'Number',
			date: 'Date',
			posted: 'Posted',
			id: 'Code'
		};
		if(syn1c[v])
			return syn1c[v];
		return m.syns_1с[m.syns_js.indexOf(v)] || v;
	};

	this.printing_plates = function (pp) {
		if(pp)
			for(var i in pp.doc)
				m.doc[i].printing_plates = pp.doc[i];

	};

	// Экспортируем ссылку на себя
	_md = $p.md = this;


	// создаём объекты менеджеров

	for(class_name in m.enm)
		_enm[class_name] = new EnumManager(m.enm[class_name], "enm."+class_name);

	for(class_name in m.cat){
		_cat[class_name] = new CatManager("cat."+class_name);
	}

	for(class_name in m.doc){
		_doc[class_name] = new DocManager("doc."+class_name);
	}

	for(class_name in m.ireg){
		_ireg[class_name] = new InfoRegManager("ireg."+class_name);
	}

	for(class_name in m.dp)
		_dp[class_name] = new DataProcessorsManager("dp."+class_name);

	for(class_name in m.cch)
		_cch[class_name] = new ChartOfCharacteristicManager("cch."+class_name);

	for(class_name in m.cacc)
		_cacc[class_name] = new ChartOfAccountManager("cacc."+class_name);

	// загружаем модификаторы и прочие зависимости
	$p.modifiers.execute();

	return {
		md_date: m["md_date"],
		cat_date: m["cat_date"]
	};
}

/**
 * Загрузка данных в grid
 * @method load_soap_to_grid
 * @for Catalogs
 * @param attr {Object} - объект с параметрами запроса SOAP
 * @param grid {dhtmlxGrid}
 * @param callback {Function}
 */
_cat.load_soap_to_grid = function(attr, grid, callback){

	function cb_callBack(res){
		if(res.substr(0,1) == "{")
			res = JSON.parse(res);

		if(typeof res == "string")
		// загружаем строку в грид
			grid.loadXMLString(res, function(){
				if(callback)
					callback(res);
			});

		else if(callback)
			callback(res);
	}

	grid.xmlFileUrl = "exec";


	var mgr = _md.mgr_by_class_name(attr.class_name);

	if(!mgr._cachable && ($p.job_prm.rest || attr.rest))
		mgr.rest_selection(attr)
			.then(cb_callBack)
			.catch(function (error) {
				console.log(error);
			});
	else
		_load(attr)
			.then(cb_callBack)
			.catch(function (error) {
				console.log(error);
			});

};/**
 * Конструкторы менеджеров данных
 * @module  metadata
 * @submodule meta_mngrs
 * @author	Evgeniy Malyarov
 * @requires common
 */



/**
 * Абстрактный менеджер данных: и ссылочных и с суррогратным ключом и несохраняемых обработок
 * @class DataManager
 * @constructor
 * @param class_name {string} - имя типа менеджера объекта. например, "doc.calc_order"
 */
function DataManager(class_name){

	var _metadata = _md.get(class_name),
		_cachable,
		_events = {
			after_create: [],
			after_load: [],
			before_save: [],
			after_save: [],
			value_change: []
		};

	// перечисления кешируются всегда
	if(class_name.indexOf("enm.") != -1)
		_cachable = true;

	// если offline, все объекты кешируем
	else if($p.job_prm.offline)
		_cachable = true;

	// документы, отчеты и обработки по умолчанию не кешируем
	else if(class_name.indexOf("doc.") != -1 || class_name.indexOf("dp.") != -1 || class_name.indexOf("rep.") != -1)
		_cachable = false;

	// остальные классы по умолчанию кешируем
	else
		_cachable = true;

	// Если в метаданных явно указано правило кеширования, используем его
	if(!$p.job_prm.offline && _metadata.hasOwnProperty("cachable"))
		_cachable = _metadata.cachable;


	/**
	 * Выполняет две функции:
	 * - Указывает, нужно ли сохранять (искать) объекты в локальном кеше или сразу топать на сервер
	 * - Указывает, нужно ли запоминать представления ссылок (инверсно). Для кешируемых, представления ссылок запоминать необязательно, т.к. его быстрее вычислить по месту
	 * @property _cachable
	 * @type Boolean
	 */
	this._define("_cachable", {
		value: _cachable,
		writable: true,
		enumerable: false
	});


	/**
	 * Имя типа объектов этого менеджера
	 * @property class_name
	 * @type String
	 */
	this._define("class_name", {
		value: class_name,
		writable: false,
		enumerable: false
	});


	/**
	 * Указатель на массив, сопоставленный с таблицей локальной базы данных
	 * Фактически - хранилище объектов данного класса
	 * @property alatable
	 * @type Array
	 */
	this._define("alatable", {
		get : function () {
			return $p.wsql.aladb.tables[this.table_name] ? $p.wsql.aladb.tables[this.table_name].data : []
		},
		enumerable : false
	});

	/**
	 * Метаданные объекта (указатель на фрагмент глобальных метаданных, относящмйся к текущему объекту)
	 * @property metadata
	 * @type {Object} - объект метаданных
	 */
	this._define("metadata", {
		value: function(field){
			if(field)
				return _metadata.fields[field] || _metadata.tabular_sections[field];
			else
				return _metadata;
		},
		enumerable: false
	});

	/**
	 * Добавляет подписку на события объектов данного менеджера
	 * @param name {String} - имя события
	 * @param method {Function} - добавляемый метод
	 * @param [first] {Boolean} - добавлять метод в начало, а не в конец коллекции
	 */
	this.attache_event = function (name, method, first) {
		if(first)
			_events[name].push(method);
		else
			_events[name].push(method);
	};

	/**
	 * Выполняет методы подписки на событие
	 * @param obj {DataObj} - объект, в котором произошло событие
	 * @param name {String} - имя события
	 * @param attr {Object} - дополнительные свойства, передаваемые в обработчик события
	 */
	this.handle_event = function (obj, name, attr) {
		var res;
		_events[name].forEach(function (method) {
			if(res !== false)
				res = method.call(obj, attr);
		});
		return res;
	};


	//	Создаём функции конструкторов экземпляров объектов и строк табличных частей
	var _obj_сonstructor = this._obj_сonstructor || DataObj;		// ссылка на конструктор элементов

	// Для всех типов, кроме перечислений, создаём через (new Function) конструктор объекта
	if(!(this instanceof EnumManager)){

		var obj_сonstructor_name = class_name.split(".")[1];
		this._obj_сonstructor = eval("(function " + obj_сonstructor_name.charAt(0).toUpperCase() + obj_сonstructor_name.substr(1) +
			"(attr, manager){manager._obj_сonstructor.superclass.constructor.call(this, attr, manager)})");
		this._obj_сonstructor._extend(_obj_сonstructor);

		if(this instanceof InfoRegManager){

			delete this._obj_сonstructor.prototype.deleted;
			delete this._obj_сonstructor.prototype.ref;
			delete this._obj_сonstructor.prototype.lc_changed;

			// реквизиты по метаданным
			for(var f in this.metadata().dimensions){
				this._obj_сonstructor.prototype._define(f, {
					get : new Function("return this._getter('"+f+"')"),
					set : new Function("v", "this._setter('"+f+"',v)"),
					enumerable : true
				});
			}
			for(var f in this.metadata().resources){
				this._obj_сonstructor.prototype._define(f, {
					get : new Function("return this._getter('"+f+"')"),
					set : new Function("v", "this._setter('"+f+"',v)"),
					enumerable : true
				});
			}

		}else{

			this._ts_сonstructors = {};             // ссылки на конструкторы строк табчастей

			// реквизиты по метаданным
			for(var f in this.metadata().fields){
				this._obj_сonstructor.prototype._define(f, {
					get : new Function("return this._getter('"+f+"')"),
					set : new Function("v", "this._setter('"+f+"',v)"),
					enumerable : true
				});
			}

			// табличные части по метаданным
			for(var f in this.metadata().tabular_sections){

				// создаём конструктор строки табчасти
				var row_сonstructor_name = obj_сonstructor_name.charAt(0).toUpperCase() + obj_сonstructor_name.substr(1) + f.charAt(0).toUpperCase() + f.substr(1) + "Row";

				this._ts_сonstructors[f] = eval("(function " + row_сonstructor_name + "(owner) \
			{owner._owner._manager._ts_сonstructors[owner._name].superclass.constructor.call(this, owner)})");
				this._ts_сonstructors[f]._extend(TabularSectionRow);

				// в прототипе строки табчасти создаём свойства в соответствии с полями табчасти
				for(var rf in this.metadata().tabular_sections[f].fields){
					this._ts_сonstructors[f].prototype._define(rf, {
						get : new Function("return this._getter('"+rf+"')"),
						set : new Function("v", "this._setter('"+rf+"',v)"),
						enumerable : true
					});
				}

				// устанавливаем геттер и сеттер для табличной части
				this._obj_сonstructor.prototype._define(f, {
					get : new Function("return this._getter_ts('"+f+"')"),
					set : new Function("v", "this._setter_ts('"+f+"',v)"),
					enumerable : true
				});
			}

		}
	}

	_obj_сonstructor = null;

}

/**
 * Возвращает имя семейства объектов данного менеджера<br />
 * Примеры: "справочников", "документов", "регистров сведений"
 * @property family_name
 * @for DataManager
 * @type String
 */
DataManager.prototype._define("family_name", {
	get : function () {
		return $p.msg["meta_"+this.class_name.split(".")[0]+"_mgr"].replace($p.msg.meta_mgr+" ", "");
	},
	enumerable : false
});

/**
 * Регистрирует время изменения при заиси объекта для целей синхронизации
 */
DataManager.prototype.register_ex = function(){

};

/**
 * Выводит фрагмент списка объектов данного менеджера, ограниченный фильтром attr в grid
 * @method sync_grid
 * @for DataManager
 * @param grid {dhtmlXGridObject}
 * @param attr {Object}
 */
DataManager.prototype.sync_grid = function(grid, attr){

	var res;

	if(this._cachable)
		;
	else if($p.job_prm.rest || attr.rest){

		if(attr.action == "get_tree")
			res = this.rest_tree();

		else if(attr.action == "get_selection")
			res = this.rest_selection();

	}

};

/**
 * Возвращает массив доступных значений для комбобокса
 * @method get_option_list
 * @for DataManager
 * @param val {DataObj|String}
 * @param filter {Object}
 * @return {Array}
 */
DataManager.prototype.get_option_list = function(val, filter){
	var l = [];
	function check(v){
		if($p.is_equal(v.value, val))
			v.selected = true;
		return v;
	}
	this.find_rows(filter, function (v) {
		l.push(check({text: v.presentation, value: v.ref}));
	});
	return l;
};

/**
 * Заполняет свойства в объекте source в соответствии с реквизитами табчасти
 * @param tabular {String} - имя табчасти
 * @param source {Object}
 */
DataManager.prototype.tabular_captions = function (tabular, source) {

};

/**
 * Возаращает строку xml для инициализации PropertyGrid
 * @method get_property_grid_xml
 * @param oxml {Object} - объект с иерархией полей (входной параметр - правила)
 * @param o {DataObj} - объект данных, из полей и табличных частей которого будут прочитаны значения
 * @return {string} - XML строка в терминах dhtml.PropertyGrid
 */
DataManager.prototype.get_property_grid_xml = function(oxml, o){
	var i, j, mf, v, ft, txt, t = this, row_id, gd = '<rows>',

		default_oxml = function () {
			if(oxml)
				return;
			mf = t.metadata();

			if(mf.form && mf.form.obj){
				oxml = mf.form.obj.head;

			}else{
				oxml = {" ": []};

				if(o instanceof CatObj){
					if(mf.code_length)
						oxml[" "].push("id");
					if(mf.main_presentation_name)
						oxml[" "].push("name");
				}else if(o instanceof DocObj){
					oxml[" "].push("number_doc");
					oxml[" "].push("date");
				}
				if(!o.is_folder){
					for(i in mf.fields)
						if(!mf.fields[i].hide)
							oxml[" "].push(i);
				}
				if(mf.tabular_sections["extra_fields"])
					oxml["Дополнительные реквизиты"] = [];
			}


		},

		txt_by_type = function (fv, mf) {

			if($p.is_data_obj(fv))
				txt = fv.presentation;
			else
				txt = fv;

			if(mf.type.is_ref){
				;
			} else if(mf.type.date_part) {
				txt = $p.dateFormat(txt, "");

			} else if(mf.type.types[0]=="boolean") {
				txt = txt ? "1" : "0";
			}
		},

		by_type = function(fv){

			ft = _md.control_by_type(mf.type);
			txt_by_type(fv, mf);

		},

		add_xml_row = function(f, tabular){
			if(tabular){
				var pref = f["property"] || f["param"] || f["Параметр"],
					pval = f["value"] != undefined ? f["value"] : f["Значение"];
				if(pref.empty()) {
					row_id = tabular + "|" + "empty";
					ft = "ro";
					txt = "";
					mf = {synonym: "?"};

				}else{
					mf = {synonym: pref.presentation, type: pref.type};
					row_id = tabular + "|" + pref.ref;
					by_type(pval);
					if(ft == "ref")
						ft = "refc";
					else if(ft == "edn")
						ft = "calck";

					if(pref.mandatory)
						ft += '" class="cell_mandatory';
				}

			}else if(typeof f === "object"){
				mf = {synonym: f.synonym};
				row_id = f.id;
				ft = f.type;
				txt = "";
				if(f.hasOwnProperty("txt"))
					txt = f.txt;
				else if((v = o[row_id]) !== undefined)
					txt_by_type(v, _md.get(t.class_name, row_id));

			}else if((v = o[f]) !== undefined){
				mf = _md.get(t.class_name, row_id = f);
				by_type(v);

			}else
				return;

			gd += '<row id="' + row_id + '"><cell>' + (mf.synonym || mf.name) +
				'</cell><cell type="' + ft + '">' + txt + '</cell></row>';
		};

	default_oxml();

	for(i in oxml){
		if(i!=" ")
			gd += '<row open="1"><cell>' + i + '</cell>';	// если у блока есть заголовок, формируем блок иначе добавляем поля без иерархии

		for(j in oxml[i])
			add_xml_row(oxml[i][j]);                                // поля, описанные в текущем разделе

		if(i == "Дополнительные реквизиты" && o["extra_fields"])    // строки табчасти o.extra_fields
			o["extra_fields"].each(function(row){
				add_xml_row(row, "extra_fields");
			});

		else if(i == "Свойства изделия"){							// специфичные свойства изделия
			var added = false;
			o.params.each(function(row){
				if(row.cns_no == 0 && !row.hide){
					add_xml_row(row, "params");
					added = true;
				}
			});
			if(!added)
				add_xml_row({param: _cch.properties.get("", false)}, "params");
		}else if(i == "Параметры"){									// параметры фурнитуры
			for(var k in o.fprms){
				if(o.fprms[k].hide || o.fprms[k]["param"].empty())
					continue;
				add_xml_row(o.fprms[k], "fprms");
			}
		}


		if(i!=" ") gd += '</row>';									// если блок был открыт - закрываем
	}
	gd += '</rows>';
	return gd;
};

/**
 * Имя таблицы объектов этого менеджера в локальной базе данных
 * @property table_name
 * @type String
 */
DataManager.prototype._define("table_name", {
	get : function(){
		return this.class_name.replace(".", "_");
	},
	enumerable : false
});


/**
 * Печатает объект
 * @method print
 * @param ref {DataObj|String} - guid ссылки на объект
 * @param model {String} - идентификатор команды печати
 * @param [wnd] {dhtmlXWindows} - окно, из которого вызываем печать
 */
DataManager.prototype.print = function(ref, model, wnd){

	function tune_wnd_print(wnd_print){
		if(wnd && wnd.progressOff)
			wnd.progressOff();
		if(wnd_print)
			wnd_print.focus();
	}

	if(wnd && wnd.progressOn)
		wnd.progressOn();

	$p.ajax.get_and_show_blob($p.job_prm.hs_url(), {
		action: "print",
		class_name: this.class_name,
		ref: $p.fix_guid(ref),
		model: model,
		browser_uid: $p.wsql.get_user_param("browser_uid")
	})
		.then(tune_wnd_print)
		.catch(function (err) {
			console.log(err);
		});

	setTimeout(tune_wnd_print, 3000);
};


/**
 * Aбстрактный менеджер ссылочных данных - документов и справочников
 * @class RefDataManager
 * @extends DataManager
 * @constructor
 * @param class_name {string} - имя типа менеджера объекта
 */
function RefDataManager(class_name) {

	var t = this,				// ссылка на себя
		by_ref={};				// приватное хранилище объектов по guid

	RefDataManager.superclass.constructor.call(t, class_name);

	/**
	 * Помещает элемент ссылочных данных в локальную коллекцию
	 * @method push
	 * @param o {DataObj}
	 */
	t.push = function(o, new_ref){
		if(new_ref && (new_ref != o.ref)){
			delete by_ref[o.ref];
			by_ref[new_ref] = o;
		}else
			by_ref[o.ref] = o;
	};

	/**
	 * Возвращает указатель на элементы локальной коллекции
	 * @method all
	 * @return {Object}
	 */
	t.all = function(){return by_ref};

	/**
	 * Выполняет перебор элементов локальной коллекции
	 * @method each
	 * @param fn {Function} - функция, вызываемая для каждого элемента локальной коллекции
	 */
	t.each = function(fn){
		for(var i in by_ref){
			if(!i || i == $p.blank.guid)
				continue;
			if(fn.call(this, by_ref[i]) == true)
				break;
		}
	};

	/**
	 * Возвращает объект по ссылке (читает из датабазы или локального кеша) если идентификатор пуст, создаёт новый объект
	 * @method get
	 * @param ref {String|Object} - ссылочный идентификатор
	 * @param [force_promise] {Boolean} - Если истина, возвращает промис, даже для локальных объектов. Если ложь, ищет только в локальном кеше
	 * @param [do_not_create] {Boolean} - Не создавать новый. Например, когда поиск элемента выполняется из конструктора
	 * @return {DataObj|Promise(DataObj)}
	 */
	t.get = function(ref, force_promise, do_not_create){

		var o = by_ref[ref] || by_ref[(ref = $p.fix_guid(ref))];

		if(!o){
			if(do_not_create)
				return;
			else
				o = new t._obj_сonstructor(ref, t, true);
		}

		if(force_promise === false)
			return o;

		else if(force_promise === undefined && ref === $p.blank.guid)
			return o;

		if(!t._cachable || o.is_new()){
			return o.load();	// читаем из 1С или иного сервера

		}else if(force_promise)
			return Promise.resolve(o);

		else
			return o;
	};

	/**
	 * Создаёт новый объект типа объектов текущего менеджера<br />
	 * Для кешируемых объектов, все действия происходят на клиенте<br />
	 * Для некешируемых, выполняется обращение к серверу для получения guid и значений реквизитов по умолчанию
	 * @param [attr] {Object} - значениями полей этого объекта будет заполнен создаваемый объект
	 * @param [fill_default] {Boolean} - признак, надо ли заполнять (инициализировать) создаваемый объект значениями полей по умолчанию
	 * @return {Promise.<*>}
	 */
	t.create = function(attr, fill_default){

		function do_fill(){

		}

		if(!attr || typeof attr != "object")
			attr = {};
		if(!attr.ref || !$p.is_guid(attr.ref) || $p.is_empty_guid(attr.ref))
			attr.ref = $p.generate_guid();

		var o = by_ref[attr.ref];
		if(!o){
			o = new t._obj_сonstructor(attr, t);

			if(!t._cachable && fill_default){
				var rattr = {};
				$p.ajax.default_attr(rattr, $p.job_prm.irest_url());
				rattr.url += t.rest_name + "/Create()";
				return $p.ajax.get_ex(rattr.url, rattr)
					.then(function (req) {
						return o._mixin(JSON.parse(req.response), undefined, ["ref"]);
					});
			}

			if(fill_default){
				var _obj = o._obj;
				// присваиваем типизированные значения по умолчанию
				for(var f in t.metadata().fields){
					if(_obj[f] == undefined)
						_obj[f] = "";
				}
			}
		}

		return Promise.resolve(o);
	};


	/**
	 * Находит первый элемент, в любом поле которого есть искомое значение
	 * @method find
	 * @param val {any} - значение для поиска
	 * @return {DataObj}
	 */
	t.find = function(val){
		return $p._find(by_ref, val); };

	/**
	 * Находит строки, соответствующие отбору. Eсли отбор пустой, возвращаются все строки табчасти
	 * @method find_rows
	 * @param attr {Object} - объект. в ключах имена полей, в значениях значения фильтра
	 * @param fn {Function} - callback, в который передается строка табчасти
	 * @return {Array}
	 */
	t.find_rows = function(attr, fn){ return $p._find_rows(by_ref, attr, fn); };

	/**
	 * Cохраняет объект в базе 1C либо выполняет запрос attr.action
	 * @method save
	 * @param attr {Object} - атрибуты сохраняемого объекта могут быть ранее полученным DataObj или произвольным объектом (а-ля данныеформыструктура)
	 * @return {Promise.<T>} - инфо о завершении операции
	 * @async
	 */
	t.save = function(attr){
		if(attr && (attr.specify ||
			($p.is_guid(attr.ref) && !t._cachable))) {
			return _load({
				class_name: t.class_name,
				action: attr.action || "save", attr: attr
			}).then(JSON.parse);
		}else
			return Promise.reject();
	};

	/**
	 * сохраняет массив объектов в менеджере
	 * @method load_array
	 * @param aattr {array} - массив объектов для трансформации в объекты ссылочного типа
	 * @async
	 */
	t.load_array = function(aattr){

		var ref, obj;

		for(var i in aattr){
			ref = $p.fix_guid(aattr[i]);
			if(!(obj = by_ref[ref])){
				new t._obj_сonstructor(aattr[i], t);

			}else if(obj.is_new()){
				obj._mixin(aattr[i]);
				obj._set_loaded();
			}

		}

	};

	/**
	 * Возаращает предопределенный элемент или ссылку предопределенного элемента
	 * @method predefined
	 * @param name {String} - имя предопределенного
	 * @return {DataObj}
	 */
	t.predefined = function(name){
		var p = t.metadata()["predefined"][name];
		if(!p)
			return undefined;
		return t.get(p.ref);
	};

	/**
	 * Находит перую папку в пределах подчинения владельцу
	 * @method first_folder
	 * @param owner {DataObj|String}
	 * @return {DataObj} - ссылка найденной папки или пустая ссылка
	 */
	t.first_folder = function(owner){
		for(var i in by_ref){
			var o = by_ref[i];
			if(o.is_folder && (!owner || $p.is_equal(owner, o.owner)))
				return o;
		}
		return t.get();
	};


}
RefDataManager._extend(DataManager);

/**
 * Возаращает массив запросов для создания таблиц объекта и его табличных частей
 * @method get_sql_struct
 * @param attr {Object}
 * @param attr.action {String} - [create_table, drop, insert, update, replace, select, delete]
 * @return {Object|String}
 */
RefDataManager.prototype.get_sql_struct = function(attr){
	var t = this,
		cmd = t.metadata(),
		res = {}, f,
		action = attr && attr.action ? attr.action : "create_table";


	function sql_selection(){

		var ignore_parent = !attr.parent,
			parent = attr.parent || $p.blank.guid,
			owner = attr.owner || $p.blank.guid,
			initial_value = attr.initial_value || $p.blank.guid,
			filter = attr.filter || "",
			set_parent = $p.blank.guid;

		function list_flds(){
			var flds = [], s = "_t_.ref, _t_.`deleted`";

			if(cmd.form && cmd.form.selection){
				cmd.form.selection.fields.forEach(function (fld) {
					flds.push(fld);
				});

			}else if(t instanceof DocManager){
				flds.push("posted");
				flds.push("date");
				flds.push("number_doc");

			}else{

				if(cmd["hierarchical"] && cmd["group_hierarchy"])
					flds.push("is_folder");
				else
					flds.push("0 as is_folder");

				if(t instanceof ChartOfAccountManager){
					flds.push("id");
					flds.push("name as presentation");

				}else if(cmd["main_presentation_name"])
					flds.push("name as presentation");

				else{
					if(cmd["code_length"])
						flds.push("id as presentation");
					else
						flds.push("'...' as presentation");
				}

				if(cmd["has_owners"])
					flds.push("owner");

				if(cmd["code_length"])
					flds.push("id");

			}

			flds.forEach(function(fld){
				if(fld.indexOf(" as ") != -1)
					s += ", " + fld;
				else
					s += _md.sql_mask(fld, true);
			});
			return s;

		}

		function join_flds(){

			var s = "", parts;

			if(cmd.form && cmd.form.selection){
				for(var i in cmd.form.selection.fields){
					if(cmd.form.selection.fields[i].indexOf(" as ") == -1 || cmd.form.selection.fields[i].indexOf("_t_.") != -1)
						continue;
					parts = cmd.form.selection.fields[i].split(" as ");
					parts[0] = parts[0].split(".");
					if(parts[0].length > 1){
						if(s)
							s+= "\n";
						s+= "left outer join " + parts[0][0] + " on " + parts[0][0] + ".ref = _t_." + parts[1];
					}
				}
			}
			return s;
		}

		function where_flds(){

			var s;

			if(t instanceof ChartOfAccountManager){
				s = " WHERE (" + (filter ? 0 : 1);

			}else if(cmd["hierarchical"]){
				if(cmd["has_owners"])
					s = " WHERE (" + (ignore_parent || filter ? 1 : 0) + " OR _t_.parent = '" + parent + "') AND (" +
						(owner == $p.blank.guid ? 1 : 0) + " OR _t_.owner = '" + owner + "') AND (" + (filter ? 0 : 1);
				else
					s = " WHERE (" + (ignore_parent || filter ? 1 : 0) + " OR _t_.parent = '" + parent + "') AND (" + (filter ? 0 : 1);

			}else{
				if(cmd["has_owners"])
					s = " WHERE (" + (owner == $p.blank.guid ? 1 : 0) + " OR _t_.owner = '" + owner + "') AND (" + (filter ? 0 : 1);
				else
					s = " WHERE (" + (filter ? 0 : 1);
			}

			if(t.sql_selection_where_flds){
				s += t.sql_selection_where_flds(filter);

			}else if(t instanceof DocManager)
				s += " OR _t_.number_doc LIKE '" + filter + "'";

			else{
				if(cmd["main_presentation_name"] || t instanceof ChartOfAccountManager)
					s += " OR _t_.name LIKE '" + filter + "'";

				if(cmd["code_length"])
					s += " OR _t_.id LIKE '" + filter + "'";
			}

			s += ") AND (_t_.ref != '" + $p.blank.guid + "')";


			// допфильтры форм и связей параметров выбора
			if(attr.selection){
				attr.selection.forEach(function(sel){
					for(var key in sel){

						if(cmd.fields.hasOwnProperty(key)){
							if(sel[key] === true)
								s += "\n AND _t_." + key + " ";
							else if(sel[key] === false)
								s += "\n AND (not _t_." + key + ") ";
							else if(typeof sel[key] == "string")
								s += "\n AND (_t_." + key + " = '" + sel[key] + "') ";
							else
								s += "\n AND (_t_." + key + " = " + sel[key] + ") ";
						}
					}

				});
			}

			return s;
		}

		function order_flds(){

			if(t instanceof ChartOfAccountManager){
				return "ORDER BY id";

			}else if(cmd["hierarchical"]){
				if(cmd["group_hierarchy"])
					return "ORDER BY _t_.is_folder desc, is_initial_value, presentation";
				else
					return "ORDER BY _t_.parent desc, is_initial_value, presentation";
			}else
				return "ORDER BY is_initial_value, presentation";
		}

		function selection_prms(){

			// т.к. в процессе установки может потребоваться получение объектов, код асинхронный
			function on_parent(o){

				// ссылка родителя для иерархических справочников
				if(o){
					set_parent = (attr.set_parent = o.parent.ref);
					parent = set_parent;
					ignore_parent = false;
				}else if(!filter && !ignore_parent){
					;
				}else{
					if(t.class_name == "cat.base_blocks"){
						if(owner == $p.blank.guid)
							owner = _cat.bases.predefined("main");
						parent = t.first_folder(owner).ref;
					}
				}

				// строка фильтра
				if(filter && filter.indexOf("%") == -1)
					filter = "%" + filter + "%";


				//
				//
				//// допфильтры форм и связей параметров выбора
				//Если СтруктураМД.param.Свойство("selection") Тогда
				//Для Каждого selection Из СтруктураМД.param.selection Цикл
				//Для Каждого Эл Из selection Цикл
				//Если ТипЗнч(Эл.Значение) = Тип("УникальныйИдентификатор") Тогда
				//Реквизит = СтруктураМД.МетаОбъекта.Реквизиты.Найти(ИнтеграцияСериализацияСервер.Synonim(Эл.Ключ, СтруктураМД));
				//Если Реквизит <> Неопределено Тогда
				//Для Каждого Т Из Реквизит.Тип.Типы() Цикл
				//Попытка
				//МенеджерСсылки = ОбщегоНазначения.МенеджерОбъектаПоСсылке(Новый(Т));
				//ЗначениеОтбора = МенеджерСсылки.ПолучитьСсылку(Эл.Значение);
				//Исключение
				//КонецПопытки;
				//КонецЦикла;
				//КонецЕсли;
				//Иначе
				//ЗначениеОтбора = Эл.Значение;
				//КонецЕсли;
				//Запрос.УстановитьПараметр(Эл.Ключ, ЗначениеОтбора);
				//КонецЦикла;
				//КонецЦикла;
				//КонецЕсли;
				//
				//// допфильтры форм и связей параметров выбора
				//Если СтруктураМД.param.Свойство("filter_ex") Тогда
				//Для Каждого Эл Из СтруктураМД.param.filter_ex Цикл
				//Запрос.УстановитьПараметр(Эл.Ключ, Эл.Значение);
				//КонецЦикла;
				//КонецЕсли;
			}

			// ссылка родителя во взаимосвязи с начальным значением выбора
			if(initial_value !=  $p.blank.guid && ignore_parent){
				if(cmd["hierarchical"]){
					on_parent(t.get(initial_value, false))
				}else
					on_parent();
			}else
				on_parent();

		}

		selection_prms();

		var sql;
		if(t.sql_selection_list_flds)
			sql = t.sql_selection_list_flds(initial_value);
		else
			sql = ("SELECT %2, case when _t_.ref = '" + initial_value +
			"' then 0 else 1 end as is_initial_value FROM " + t.table_name + " AS _t_ %j %3 %4 LIMIT 300")
				.replace("%2", list_flds())
				.replace("%j", join_flds())
			;

		return sql.replace("%3", where_flds()).replace("%4", order_flds());

	}

	function sql_create(){
		var sql = "CREATE TABLE IF NOT EXISTS "+t.table_name+" (ref CHAR PRIMARY KEY NOT NULL, `deleted` BOOLEAN, lc_changed INT";

		if(t instanceof DocManager)
			sql += ", posted BOOLEAN, date Date, number_doc CHAR";
		else
			sql += ", id CHAR, name CHAR, is_folder BOOLEAN";

		for(f in cmd.fields)
			sql += _md.sql_mask(f) + _md.sql_type(t, f, cmd.fields[f].type);


		for(f in cmd["tabular_sections"])
			sql += ", " + "ts_" + f + " JSON";
		sql += ")";
		return sql;
	}

	function sql_update(){
		// "INSERT OR REPLACE INTO user_params (prm_name, prm_value) VALUES (?, ?);
		var fields = ["ref", "deleted", "lc_changed"],
			sql = "INSERT INTO "+t.table_name+" (ref, `deleted`, lc_changed",
			values = "(?";

		if(t.class_name.substr(0, 3)=="cat"){
			sql += ", id, name, is_folder";
			fields.push("id");
			fields.push("name");
			fields.push("is_folder");

		}else if(t.class_name.substr(0, 3)=="doc"){
			sql += ", posted, date, number_doc";
			fields.push("posted");
			fields.push("date");
			fields.push("number_doc");

		}
		for(f in cmd.fields){
			sql += _md.sql_mask(f);
			fields.push(f);
		}
		for(f in cmd["tabular_sections"]){
			sql += ", " + "ts_" + f;
			fields.push("ts_" + f);
		}
		sql += ") VALUES ";
		for(f = 1; f<fields.length; f++){
			values += ", ?";
		}
		values += ")";
		sql += values;

		return {sql: sql, fields: fields, values: values};
	}


	if(action == "create_table")
		res = sql_create();

	else if(["insert", "update", "replace"].indexOf(action) != -1)
		res[t.table_name] = sql_update();

	else if(action == "select")
		res = "SELECT * FROM "+t.table_name+" WHERE ref = ?";

	else if(action == "select_all")
		res = "SELECT * FROM "+t.table_name;

	else if(action == "delete")
		res = "DELETE FROM "+t.table_name+" WHERE ref = ?";

	else if(action == "drop")
		res = "DROP TABLE IF EXISTS "+t.table_name;

	else if(action == "get_tree")
		res = "SELECT ref, parent, name as presentation FROM " + t.table_name + " WHERE is_folder order by parent, name";

	else if(action == "get_selection")
		res = sql_selection();

	return res;
};

// ШапкаТаблицыПоИмениКласса
RefDataManager.prototype.caption_flds = function(attr){

	var str_def = "<column id=\"%1\" width=\"%2\" type=\"%3\" align=\"%4\" sort=\"%5\">%6</column>",
		acols = [], cmd = this.metadata(),	s = "";

	function Col_struct(id,width,type,align,sort,caption){
		this.id = id;
		this.width = width;
		this.type = type;
		this.align = align;
		this.sort = sort;
		this.caption = caption;
	}

	if(cmd.form && cmd.form.selection){
		acols = cmd.form.selection.cols;

	}else if(this instanceof DocManager){
		acols.push(new Col_struct("date", "120", "ro", "left", "server", "Дата"));
		acols.push(new Col_struct("number_doc", "120", "ro", "left", "server", "Номер"));

	}else if(this instanceof ChartOfAccountManager){
		acols.push(new Col_struct("id", "120", "ro", "left", "server", "Код"));
		acols.push(new Col_struct("presentation", "*", "ro", "left", "server", "Наименование"));

	}else{

		acols.push(new Col_struct("presentation", "*", "ro", "left", "server", "Наименование"));
		//if(cmd["has_owners"]){
		//	var owner_caption = "Владелец";
		//	acols.push(new Col_struct("owner", "200", "ro", "left", "server", owner_caption));
		//}

	}

	if(attr.get_header && acols.length){
		s = "<head>";
		for(var col in acols){
			s += str_def.replace("%1", acols[col].id).replace("%2", acols[col].width).replace("%3", acols[col].type)
				.replace("%4", acols[col].align).replace("%5", acols[col].sort).replace("%6", acols[col].caption);
		}
		s += "</head>";
	}

	return {head: s, acols: acols};
};

/**
 * Менеджер обработок
 * @class DataProcessorsManager
 * @extends DataManager
 * @param class_name {string} - имя типа менеджера объекта
 * @constructor
 */
function DataProcessorsManager(class_name){

	DataProcessorsManager.superclass.constructor.call(this, class_name);

	/**
	 * Создаёт экземпляр объекта обработки
	 * @method
	 * @return {DataProcessorObj}
	 */
	this.create = function(){
		return new this._obj_сonstructor({}, this);
	};

}
DataProcessorsManager._extend(DataManager);



/**
 * Абстрактный менеджер перечисления
 * @class EnumManager
 * @extends RefDataManager
 * @param a {array} - массив значений
 * @param class_name {string} - имя типа менеджера объекта. например, "enm.open_types"
 * @constructor
 */
function EnumManager(a, class_name) {

	EnumManager.superclass.constructor.call(this, class_name);

	this._obj_сonstructor = EnumObj;

	this.push = function(o, new_ref){
		this._define(new_ref, {
			value : o,
			enumerable : false
		}) ;
	};

	this.get = function(ref){

		if(ref instanceof EnumObj)
			return ref;

		else if(!ref || ref == $p.blank.guid)
			ref = "_";

		var o = this[ref];
		if(!o)
			o = new EnumObj({name: ref}, this);

		return o;
	};

	this.each = function (fn) {
		this.alatable.forEach(function (v) {
			if(v.ref && v.ref != $p.blank.guid)
				fn.call(this[v.ref]);
		});
	};

	for(var i in a)
		new EnumObj(a[i], this);

}
EnumManager._extend(RefDataManager);


/**
 * Bозаращает массив запросов для создания таблиц объекта и его табличных частей
 * @param attr {Object}
 * @param attr.action {String} - [create_table, drop, insert, update, replace, select, delete]
 * @return {Object|String}
 */
EnumManager.prototype.get_sql_struct = function(attr){

	var res,
		action = attr && attr.action ? attr.action : "create_table";

	if(action == "create_table")
		res = "CREATE TABLE IF NOT EXISTS "+this.table_name+
			" (ref CHAR PRIMARY KEY NOT NULL, sequence INT, synonym CHAR)";
	else if(["insert", "update", "replace"].indexOf(action) != -1){
		res = {};
		res[this.table_name] = {
			sql: "INSERT INTO "+this.table_name+" (ref, sequence, synonym) VALUES (?, ?, ?)",
			fields: ["ref", "sequence", "synonym"],
			values: "(?, ?, ?)"
		};
	}else if(action == "delete")
		res = "DELETE FROM "+this.table_name+" WHERE ref = ?";

	return res;

};

/**
 * Возвращает массив доступных значений для комбобокса
 * @param val {DataObj|String}
 * @param filter {Object}
 * @return {Array}
 */
EnumManager.prototype.get_option_list = function(val){
	var l = [];
	function check(v){
		if($p.is_equal(v.value, val))
			v.selected = true;
		return v;
	}
	this.alatable.forEach(function (v) {
		l.push(check({text: v.synonym, value: v.ref}));
	});
	return l;
};


/**
 * Абстрактный менеджер регистра (накопления и сведений)
 * @class InfoRegManager
 * @extends DataManager
 * @constructor
 * @param class_name {string} - имя типа менеджера объекта. например, "ireg.prices"
 */
function RegisterManager(class_name){

	var by_ref={};				// приватное хранилище объектов по ключу записи

	this._obj_сonstructor = RegisterRow;

	RegisterManager.superclass.constructor.call(this, class_name);

	/**
	 * Помещает элемент ссылочных данных в локальную коллекцию
	 * @method push
	 * @param o {RegisterRow}
	 */
	this.push = function(o, new_ref){
		if(new_ref && (new_ref != o.ref)){
			delete by_ref[o.ref];
			by_ref[new_ref] = o;
		}else
			by_ref[o.ref] = o;
	};

	/**
	 * Возвращает массив записей c заданным отбором либо запись по ключу
	 * @method get
	 * @for InfoRegManager
	 * @param attr {Object} - объект {key:value...}
	 * @param force_promise {Boolesn} - возаращять промис, а не массив
	 * @param return_row {Boolesn} - возвращать запись, а не массив
	 * @return {*}
	 */
	this.get = function(attr, force_promise, return_row){

		if(!attr)
			attr = {};
		attr.action = "select";

		var arr = alasql(this.get_sql_struct(attr), attr._values),
			res;

		delete attr.action;
		delete attr._values;

		if(arr.length){
			if(return_row)
				res = by_ref[this.get_ref(arr[0])];
			else{
				res = [];
				for(var i in arr)
					res.push(by_ref[this.get_ref(arr[i])]);
			}
		}
		return force_promise ? Promise.resolve(res) : res;
	};

	/**
	 * сохраняет массив объектов в менеджере
	 * @method load_array
	 * @param aattr {array} - массив объектов для трансформации в объекты ссылочного типа
	 * @async
	 */
	this.load_array = function(aattr){

		var key, obj, res = [];

		for(var i in aattr){

			key = this.get_ref(aattr[i]);

			if(!(obj = by_ref[key])){
				new this._obj_сonstructor(aattr[i], this);

			}else
				obj._mixin(aattr[i]);

			res.push(by_ref[key]);
		}
		return res;

	};

}
RegisterManager._extend(DataManager);

/**
 * Возаращает запросов для создания таблиц или извлечения данных
 * @method get_sql_struct
 * @for RegisterManager
 * @param attr {Object}
 * @param attr.action {String} - [create_table, drop, insert, update, replace, select, delete]
 * @return {Object|String}
 */
RegisterManager.prototype.get_sql_struct = function(attr) {
	var t = this,
		cmd = t.metadata(),
		res = {}, f,
		action = attr && attr.action ? attr.action : "create_table";

	function sql_create(){
		var sql = "CREATE TABLE IF NOT EXISTS "+t.table_name+" (",
			first_field = true;

		for(f in cmd["dimensions"]){
			if(first_field){
				sql += f;
				first_field = false;
			}else
				sql += _md.sql_mask(f);
			sql += _md.sql_type(t, f, cmd["dimensions"][f].type);
		}

		for(f in cmd["resources"])
			sql += _md.sql_mask(f) + _md.sql_type(t, f, cmd["resources"][f].type);

		sql += ", PRIMARY KEY (";
		first_field = true;
		for(f in cmd["dimensions"]){
			if(first_field){
				sql += f;
				first_field = false;
			}else
				sql += _md.sql_mask(f);
		}

		sql += "))";

		return sql;
	}

	function sql_update(){
		// "INSERT OR REPLACE INTO user_params (prm_name, prm_value) VALUES (?, ?);
		var sql = "INSERT OR REPLACE INTO "+t.table_name+" (",
			fields = [],
			first_field = true;

		for(f in cmd["dimensions"]){
			if(first_field){
				sql += f;
				first_field = false;
			}else
				sql += ", " + f;
			fields.push(f);
		}
		for(f in cmd["resources"]){
			sql += ", " + f;
			fields.push(f);
		}

		sql += ") VALUES (?";
		for(f = 1; f<fields.length; f++){
			sql += ", ?";
		}
		sql += ")";

		return {sql: sql, fields: fields};
	}

	function sql_select(){
		var sql = "SELECT * FROM "+t.table_name+" WHERE ",
			first_field = true;
		attr._values = [];

		for(var f in attr){
			if(f == "action" || f == "_values")
				continue;

			if(first_field)
				first_field = false;
			else
				sql += " and ";

			sql += f + "=?";
			attr._values.push(attr[f]);
		}

		if(first_field)
			sql += "1";

		return sql;
	}


	if(action == "create_table")
		res = sql_create();

	else if(action in {insert:"", update:"", replace:""})
		res[t.table_name] = sql_update();

	else if(action == "select")
		res = sql_select();

	else if(action == "select_all")
		res = sql_select();

	else if(action == "delete")
		res = "DELETE FROM "+t.table_name+" WHERE ref = ?";

	else if(action == "drop")
		res = "DROP TABLE IF EXISTS "+t.table_name;

	return res;
};

RegisterManager.prototype.get_ref = function(attr){
	var key = "", ref,
		dimensions = this.metadata().dimensions;
	if(attr instanceof RegisterRow)
		attr = attr._obj;
	for(var j in dimensions){
		key += (key ? "_" : "");
		if(dimensions[j].type.is_ref)
			key += $p.fix_guid(attr[j]);

		else if(!attr[j] && dimensions[j].type.digits)
			key += "0";

		else if(dimensions[j].date_part)
			key += $p.dateFormat(attr[j] || $p.blank.date, $p.dateFormat.masks.atom);

		else if(attr[j]!=undefined)
			key += String(attr[j]);

		else
			key += "$";
	}
	return key;
};




/**
 * Абстрактный менеджер регистра сведений
 * @class InfoRegManager
 * @extends RegisterManager
 * @constructor
 * @param class_name {string} - имя типа менеджера объекта. например, "ireg.prices"
 */
function InfoRegManager(class_name){

	InfoRegManager.superclass.constructor.call(this, class_name);

}
InfoRegManager._extend(RegisterManager);

/**
 * Возаращает массив записей - срез первых значений по ключам отбора
 * @method slice_first
 * @for InfoRegManager
 * @param filter {Object} - отбор + период
 */
InfoRegManager.prototype.slice_first = function(filter){

};

/**
 * Возаращает массив записей - срез последних значений по ключам отбора
 * @method slice_last
 * @for InfoRegManager
 * @param filter {Object} - отбор + период
 */
InfoRegManager.prototype.slice_last = function(filter){

};



/**
 * Абстрактный менеджер регистра накопления
 * @class AccumRegManager
 * @extends RegisterManager
 * @constructor
 * @param class_name {string} - имя типа менеджера объекта. например, "areg.goods_on_stores"
 */
function AccumRegManager(class_name){

	AccumRegManager.superclass.constructor.call(this, class_name);
}
AccumRegManager._extend(RegisterManager);




/**
 * Абстрактный менеджер справочника
 * @class CatManager
 * @extends RefDataManager
 * @constructor
 * @param class_name {string}
 */
function CatManager(class_name) {

	this._obj_сonstructor = CatObj;		// ссылка на конструктор элементов

	CatManager.superclass.constructor.call(this, class_name);

	// реквизиты по метаданным
	if(this.metadata().hierarchical && this.metadata().group_hierarchy){

		/**
		 * признак "это группа"
		 * @property is_folder
		 * @for CatObj
		 * @type {Boolean}
		 */
		this._obj_сonstructor.prototype._define("is_folder", {
			get : function(){ return this._obj.is_folder || false},
			set : function(v){ this._obj.is_folder = $p.fix_boolean(v)},
			enumerable : true
		});
	}

}
CatManager._extend(RefDataManager);

/**
 * Возвращает объект по наименованию
 * @method by_name
 * @param name {String|Object} - искомое наименование
 * @return {DataObj}
 */
CatManager.prototype.by_name = function(name){

	var o;

	this.find_rows({name: name}, function (obj) {
		o = obj;
		return false;
	});

	if(!o)
		o = this.get();

	return o;
};

/**
 * Возвращает объект по коду
 * @method by_id
 * @param id {String|Object} - искомый код
 * @return {DataObj}
 */
CatManager.prototype.by_id = function(id){

	var o;

	this.find_rows({id: id}, function (obj) {
		o = obj;
		return false;
	});

	if(!o)
		o = this.get();

	return o;
};



/**
 * Абстрактный менеджер плана видов характеристик
 * @class ChartOfCharacteristicManager
 * @extends CatManager
 * @constructor
 * @param class_name {string}
 */
function ChartOfCharacteristicManager(class_name){

	this._obj_сonstructor = CatObj;		// ссылка на конструктор элементов

	ChartOfCharacteristicManager.superclass.constructor.call(this, class_name);

}
ChartOfCharacteristicManager._extend(CatManager);


/**
 * Абстрактный менеджер плана видов характеристик
 * @class ChartOfAccountManager
 * @extends CatManager
 * @constructor
 * @param class_name {string}
 */
function ChartOfAccountManager(class_name){

	this._obj_сonstructor = CatObj;		// ссылка на конструктор элементов

	ChartOfAccountManager.superclass.constructor.call(this, class_name);

}
ChartOfAccountManager._extend(CatManager);


/**
 * Абстрактный менеджер документов
 * @class DocManager
 * @extends RefDataManager
 * @constructor
 * @param class_name {string}
 */
function DocManager(class_name) {

	this._obj_сonstructor = DocObj;		// ссылка на конструктор элементов

	DocManager.superclass.constructor.call(this, class_name);


}
DocManager._extend(RefDataManager);
/**
 * Конструкторы табличных частей
 * @module  metadata
 * @submodule meta_tabulars
 * @author	Evgeniy Malyarov
 * @requires common
 */


/**
 * Абстрактный объект табличной части
 * Физически, данные хранятся в DataObj`екте, а точнее - в поле типа массив и именем табчасти объекта _obj
 * Класс TabularSection предоставляет методы для манипуляции этими данными
 * @class TabularSection
 * @constructor
 * @param name {String} - имя табчасти
 * @param owner {DataObj} - владелец табличной части
 */
function TabularSection(name, owner){

	// Если табчасти нет в данных владельца - создаём
	if(!owner._obj[name])
		owner._obj[name] = [];

	/**
	 * Имя табличной части
	 * @property _name
	 * @type String
	 */
	this._define('_name', {
		value : name,
		enumerable : false
	});

	/**
	 * Объект-владелец табличной части
	 * @property _owner
	 * @type DataObj
	 */
	this._define('_owner', {
		value : owner,
		enumerable : false
	});

	/**
	 * Фактическое хранилище данных объекта
	 * Оно же, запись в таблице объекта локальной базы данных
	 * @property _obj
	 * @type Object
	 */
	this._define("_obj", {
		value: owner._obj[name],
		writable: false,
		enumerable: false
	});
}

TabularSection.prototype.toString = function(){
	return "Табличная часть " + this._owner._manager.class_name + "." + this._name
};

/**
 * Возвращает строку табчасти по индексу
 * @method get
 * @param index {Number} - индекс строки табчасти
 * @return {TabularSectionRow}
 */
TabularSection.prototype.get = function(index){
	return this._obj[index]._row;
};

/**
 * Возвращает количество элементов в табчасти
 * @method count
 * @return {Number}
 */
TabularSection.prototype.count = function(){return this._obj.length};

/**
 * очищает табличнут часть
 * @method clear
 */
TabularSection.prototype.clear = function(){
	for(var i in this._obj)
		delete this._obj[i];
	this._obj.length = 0;
};

/**
 * Удаляет строку табличной части
 * @method del
 * @param val {Number|TabularSectionRow} - индекс или строка табчасти
 */
TabularSection.prototype.del = function(val){
	var index, _obj = this._obj, j = 0;
	if(typeof val == "undefined")
		return;
	else if(typeof val == "number")
		index = val;
	else{
		for(var i in _obj)
			if(_obj[i]._row === val){
				index = Number(i);
				delete _obj[i]._row;
				break;
			}
	}
	if(index == undefined)
		return;

	_obj.splice(index, 1);

	for(var i in _obj){
		j++;
		_obj[i].row = j;
	}
};

/**
 * Находит первую строку, содержащую значение
 * @method find
 * @param val {any}
 * @return {TabularSectionRow}
 */
TabularSection.prototype.find = function(val){
	var res = $p._find(this._obj, val);
	if(res)
		return res._row;
};

/**
 * Находит строки, соответствующие отбору. Если отбор пустой, возвращаются все строки табчасти
 * @method find_rows
 * @param attr {object} - в ключах имена полей, в значениях значения фильтра
 * @param callback {function}
 * @return {Array}
 */
TabularSection.prototype.find_rows = function(attr, callback){

	var ok, o, i, j, res = [], a = this._obj;
	for(i in a){
		o = a[i];
		ok = true;
		if(attr)
			for(j in attr)
				if(!$p.is_equal(o[j], attr[j])){
					ok = false;
					break;
				}
		if(ok){
			if(callback){
				if(callback.call(this, o._row) === false)
					break;
			}else
				res.push(o._row);
		}
	}
	return res;
};

/**
 * Сдвигает указанную строку табличной части на указанное смещение
 * @method swap
 * @param rowid1 {number}
 * @param rowid2 {number}
 */
TabularSection.prototype.swap = function(rowid1, rowid2){
	var tmp = this._obj[rowid1];
	this._obj[rowid1] = this._obj[rowid2];
	this._obj[rowid2] = tmp;
};

/**
 * добавляет строку табчасти
 * @method add
 * @param attr {object} - объект со значениями полей. если некого поля нет в attr, для него используется пустое значение типа
 * @return {TabularSectionRow}
 */
TabularSection.prototype.add = function(attr){

	var row = new this._owner._manager._ts_сonstructors[this._name](this);

	// если передали значения по умолчанию, миксуем
	if(attr)
		row._mixin(attr || {});

	// присваиваем типизированные значения по умолчанию
	for(var f in row._metadata.fields){
		if(row._obj[f] == undefined)
			row[f] = "";
	}

	row._obj.row = this._obj.push(row._obj);
	row._obj._define("_row", {
		value: row,
		enumerable: false
	});

	attr = null;
	return row;
};

/**
 * Выполняет цикл "для каждого"
 * @method each
 * @param fn {function} - callback, в который передается строка табчасти
 */
TabularSection.prototype.each = function(fn){
	var t = this;
	t._obj.forEach(function(row){
		return fn.call(t, row._row);
	});
};

/**
 * загружает табличнут часть из массива объектов
 * @method load
 * @param aattr {Array} - массив объектов к загрузке
 */
TabularSection.prototype.load = function(aattr){
	this.clear();
	for(var i in aattr)
		this.add(aattr[i]);
};

/**
 * Перезаполняет грид данными табчасти
 * @method sync_grid
 * @param grid {dhtmlxGrid} - элемент управления
 */
TabularSection.prototype.sync_grid = function(grid){
	var grid_data = {rows: []},
		source = grid.getUserData("", "source");
	grid.clearAll();
	grid.setUserData("", "source", source);
	this.each(function(r){
		var data = [];
		for(var f in source.fields){
			if($p.is_data_obj(r[source.fields[f]]))
				data.push(r[source.fields[f]].presentation);
			else
				data.push(r[source.fields[f]]);
		}
		grid_data.rows.push({ id: r.row, data: data });
	});
	try{ grid.parse(grid_data, "json"); } catch (e){}
	grid.callEvent("onGridReconstructed",[]);
};

TabularSection.prototype.toJSON = function () {
	return this._obj;
};



/**
 * Aбстрактная строка табличной части
 * @class TabularSectionRow
 * @constructor
 * @param owner {TabularSection} - табличная часть, которой принадлежит строка
 */
function TabularSectionRow(owner){

	var _obj = {};

	/**
	 * Указатель на владельца данной строки табличной части
	 * @property _owner
	 * @type TabularSection
	 */
	this._define('_owner', {
		value : owner,
		enumerable : false
	});

	/**
	 * Фактическое хранилище данных объекта
	 * отображается в поле типа json записи в таблице объекта локальной базы данных
	 * @property _obj
	 * @type Object
	 */
	this._define("_obj", {
		value: _obj,
		writable: false,
		enumerable: false
	});

}

/**
 * Метаданые строки табличной части
 * @property row
 * @for TabularSectionRow
 * @type Number
 */
TabularSectionRow.prototype._define('_metadata', {
	get : function(){ return this._owner._owner._metadata["tabular_sections"][this._owner._name]},
	enumerable : false
});

/**
 * Номер строки табличной части
 * @property row
 * @for TabularSectionRow
 * @type Number
 */
TabularSectionRow.prototype._define("row", {
	get : function(){ return this._obj.row || 0},
	enumerable : true
});

TabularSectionRow.prototype._define("_clone", {
	value : function(){
		var row = new this._owner._owner._manager._ts_сonstructors[this._owner._name](this._owner)._mixin(this._obj);
		return row;
	},
	enumerable : false
});


/**
 * Конструкторы объектов данных
 * @module  metadata
 * @submodule meta_objs
 * @author	Evgeniy Malyarov
 * @requires common
 */


/**
 * Абстрактный объект ссылочных данных - документов и справочников
 * @class DataObj
 * @param attr {Object} - объект с реквизитами в свойствах или строка guid ссылки
 * @param manager {RefDataManager}
 * @constructor
 */
function DataObj(attr, manager) {

	var ref, tmp,
		_ts_ = {},
		_obj = {data_version: ""},
		_is_new = !(this instanceof EnumObj);

	// если объект с такой ссылкой уже есть в базе, возвращаем его и не создаём нового
	if(!(manager instanceof DataProcessorsManager) && !(manager instanceof EnumManager))
		tmp = manager.get(attr, false, true);

	if(tmp)
		return tmp;

	if(manager instanceof EnumManager)
		_obj.ref = ref = attr.name;

	else if(!(manager instanceof RegisterManager)){
		_obj.ref = ref = $p.fix_guid(attr);
		_obj.deleted = false;
		_obj.lc_changed = 0;

	}else
		ref = manager.get_ref(attr);

	/**
	 * Указатель на менеджер данного объекта
	 * @property _manager
	 * @type DataManager
	 */
	this._define('_manager', {
		value : manager,
		enumerable : false
	});

	/**
	 * Возвращает "истина" для нового (еще не записанного или непрочитанного) объекта
	 * @method is_new
	 * @for DataObj
	 * @return {boolean}
	 */
	this._define("is_new", {
		value: function(){
			return _is_new;
		},
		enumerable: false
	});

	this._define("_set_loaded", {
		value: function(ref){
			_is_new = false;
			manager.push(this, ref);
		},
		enumerable: false
	});


	/**
	 * Фактическое хранилище данных объекта
	 * Оно же, запись в таблице объекта локальной базы данных
	 * @property _obj
	 * @type Object
	 */
	this._define("_obj", {
		value: _obj,
		writable: false,
		enumerable: false
	});

	this._define("_ts_", {
		value: function( name ) {
			if( !_ts_[name] ) {
				_ts_[name] = new TabularSection(name, this);
			}
			return _ts_[name];
		},
		enumerable: false
	});


	if(manager.alatable && manager.push){
		manager.alatable.push(_obj);
		manager.push(this, ref);
	}

}

DataObj.prototype.valueOf = function () {
	return this.ref;
};

/**
 * Обработчик при сериализации объекта
 * @return {*}
 */
DataObj.prototype.toJSON = function () {
	return this._obj;
};

DataObj.prototype._getter = function (f) {

	var mf = this._metadata.fields[f].type,
		mgr, ref;

	if(f == "type" && typeof this._obj[f] == "object")
		return this._obj[f];

	else if(f == "ref"){
		return this._obj[f];

	}else if(mf.is_ref){
		if(mgr = _md.value_mgr(this._obj, f, mf)){
			if(mgr instanceof DataManager)
				return mgr.get(this._obj[f], false);
			else
				return $p.fetch_type(this._obj[f], mgr);
		}else{
			console.log([f, mf, this._obj]);
			return null;
		}

	}else if(mf.date_part)
		return $p.fix_date(this._obj[f], true);

	else if(mf.digits)
		return $p.fix_number(this._obj[f], true);

	else if(mf.types[0]=="boolean")
		return $p.fix_boolean(this._obj[f]);

	else
		return this._obj[f] || "";
};

DataObj.prototype._setter = function (f, v) {

	var mf = this._metadata.fields[f].type,
		mgr;

	if(f == "type" && v.types)
		this._obj[f] = v;

	else if(f == "ref")

		this._obj[f] = $p.fix_guid(v);

	else if(mf.is_ref){

		this._obj[f] = $p.fix_guid(v);

		mgr = _md.value_mgr(this._obj, f, mf, false, v);

		if(mgr){
			if(mgr instanceof EnumManager){
				if(typeof v == "string")
					this._obj[f] = v;

				else if(!v)
					this._obj[f] = "";

				else if(typeof v == "object")
					this._obj[f] = v.ref || v.name || "";

			}else if(v && v.presentation){
				if(v.type && !(v instanceof DataObj))
					delete v.type;
				mgr.create(v);
			}else if(!(mgr instanceof DataManager))
				this._obj[f] = $p.fetch_type(v, mgr);
		}else{
			if(typeof v != "object")
				this._obj[f] = v;
		}


	}else if(mf.date_part)
		this._obj[f] = $p.fix_date(v, true);

	else if(mf.digits)
		this._obj[f] = $p.fix_number(v, true);

	else if(mf.types[0]=="boolean")
		this._obj[f] = $p.fix_boolean(v);

	else
		this._obj[f] = v;
};

DataObj.prototype._getter_ts = function (f) {
	return this._ts_(f);
};

DataObj.prototype._setter_ts = function (f, v) {
	var ts = this._ts_(f);
	if(ts instanceof TabularSection && Array.isArray(v))
		ts.load(v);
};


/**
 * Читает объект из внешней датабазы асинхронно.
 * @method load
 * @for DataObj
 * @return {Promise.<T>} - промис с результатом выполнения операции
 * @async
 */
DataObj.prototype.load = function(){

	var tObj = this;

	function callback_1c(res){		// инициализация из датабазы 1C

		if(typeof res == "string")
			res = JSON.parse(res);
		if($p.msg.check_soap_result(res))
			return;

		var ref = $p.fix_guid(res);
		if(tObj.is_new() && !$p.is_empty_guid(ref))
			tObj._set_loaded(ref);

		return tObj._mixin(res);      // заполнить реквизиты шапки и табличных частей
	}

	if(tObj._manager._cachable && !tObj.is_new())
		return Promise.resolve(tObj);

	if(tObj.ref == $p.blank.guid){
		if(tObj instanceof CatObj)
			tObj.id = "000000000";
		else
			tObj.number_doc = "000000000";
		return Promise.resolve(tObj);

	}else if(!tObj._manager._cachable && $p.job_prm.rest)
		return tObj.load_rest();

	else
		return _load({
			class_name: tObj._manager.class_name,
			action: "load",
			ref: tObj.ref
		})
			.then(callback_1c);



};

/**
 * Сохраняет объект в локальной датабазе, выполняет подписки на события
 * В зависимости от настроек, инициирует запись объекта во внешнюю базу данных
 * @param [post] {Boolean|undefined} - проведение или отмена проведения или просто запись
 * @param [mode] {Boolean} - режим проведения документа [Оперативный, Неоперативный]
 * @return {Promise.<T>} - промис с результатом выполнения операции
 * @async
 */
DataObj.prototype.save = function (post, operational) {

	// Если процедуры перед записью завершились неудачно - не продолжаем
	if(_manager.handle_event(this, "before_save") === false)
		return Promise.resolve(this);

	// Сохраняем во внешней базе
	this.save_rest({
		url: $p.job_prm.rest_url(),
		username: $p.ajax.username,
		password: $p.ajax.password,
		post: post,
		operational: operational
	})

		// и выполняем обработку после записи
		.then(function (obj) {
			return _manager.handle_event(obj, "after_save");
		});
};

/**
 * Проверяет, является ли ссылка объекта пустой
 * @method empty
 * @return {boolean} - true, если ссылка пустая
 */
DataObj.prototype.empty = function(){
	return $p.is_empty_guid(this._obj.ref);
};


/**
 * Метаданные текущего объекта
 * @property _metadata
 * @for DataObj
 * @type Object
 */
DataObj.prototype._define('_metadata', {
	get : function(){ return this._manager.metadata()},
	enumerable : false
});

/**
 * guid ссылки объекта
 * @property ref
 * @for DataObj
 * @type String
 */
DataObj.prototype._define('ref', {
	get : function(){ return this._obj.ref},
	set : function(v){ this._obj.ref = $p.fix_guid(v)},
	enumerable : true,
	configurable: true
});

/**
 * Пометка удаления
 * @property deleted
 * @for DataObj
 * @type Boolean
 */
DataObj.prototype._define('deleted', {
	get : function(){ return this._obj.deleted},
	set : function(v){ this._obj.deleted = !!v},
	enumerable : true,
	configurable: true
});

/**
 * Версия данных для контроля изменения объекта другим пользователем
 * @property data_version
 * @for DataObj
 * @type String
 */
DataObj.prototype._define('data_version', {
	get : function(){ return this._obj.data_version || ""},
	set : function(v){ this._obj.data_version = String(v)},
	enumerable : true
});

/**
 * Время последнего изменения объекта в миллисекундах от начала времён для целей синхронизации
 * @property lc_changed
 * @for DataObj
 * @type Number
 */
DataObj.prototype._define('lc_changed', {
	get : function(){ return this._obj.lc_changed || 0},
	set : function(v){ this._obj.lc_changed = $p.fix_number(v, true)},
	enumerable : true,
	configurable: true
});

TabularSectionRow.prototype._getter = DataObj.prototype._getter;

TabularSectionRow.prototype._setter = DataObj.prototype._setter;



/**
 * Абстрактный элемент справочника
 * @class CatObj
 * @extends DataObj
 * @constructor
 * @param attr {Object} - объект с реквизитами в свойствах или строка guid ссылки
 * @param manager {RefDataManager}
 * @async
 */
function CatObj(attr, manager) {

	var _presentation = "";

	// выполняем конструктор родительского объекта
	CatObj.superclass.constructor.call(this, attr, manager);

	/**
	 * Представление объекта
	 * @property presentation
	 * @for CatObj
	 * @type String
	 */
	this._define('presentation', {
		get : function(){

			if(this.name || this.id)
				return this.name || this.id || this._metadata["obj_presentation"];
			else
				return _presentation;

		},
		set : function(v){
			if(v)
				_presentation = String(v);
		},
		enumerable : false
	});

	if(attr && typeof attr == "object")
		this._mixin(attr);

	if(!$p.is_empty_guid(this.ref) && (attr.id || attr.name))
		this._set_loaded(this.ref);
}
CatObj._extend(DataObj);

/**
 * Код элемента справочника
 * @property id
 * @type String|Number
 */
CatObj.prototype._define('id', {
	get : function(){ return this._obj.id || ""},
	set : function(v){ this._obj.id = v},
	enumerable : true
});

/**
 * Наименование элемента справочника
 * @property name
 * @type String
 */
CatObj.prototype._define('name', {
	get : function(){ return this._obj.name || ""},
	set : function(v){ this._obj.name = String(v)},
	enumerable : true
});


/**
 * Абстрактный ДокументОбъект
 * @class DocObj
 * @extends DataObj
 * @constructor
 * @param attr {Object} - объект с реквизитами в свойствах или строка guid ссылки
 * @param manager {RefDataManager}
 * @async
 */
function DocObj(attr, manager) {

	var _presentation = "";

	// выполняем конструктор родительского объекта
	DocObj.superclass.constructor.call(this, attr, manager);

	/**
	 * Представление объекта
	 * @property presentation
	 * @for DocObj
	 * @type String
	 */
	this._define('presentation', {
		get : function(){

			if(this.number_str || this.number_doc)
				return this._metadata["obj_presentation"] + ' №' + (this.number_str || this.number_doc) + " от " + $p.dateFormat(this.date, $p.dateFormat.masks.ru);
			else
				return _presentation;

		},
		set : function(v){
			if(v)
				_presentation = String(v);
		},
		enumerable : false
	});

	if(attr && typeof attr == "object")
		this._mixin(attr);

	if(!$p.is_empty_guid(this.ref) && attr.number_doc)
		this._set_loaded(this.ref);
}
DocObj._extend(DataObj);

/**
 * Номер документа
 * @property number_doc
 * @type {String|Number}
 */
DocObj.prototype._define('number_doc', {
	get : function(){ return this._obj.number_doc || ""},
	set : function(v){ this._obj.number_doc = v},
	enumerable : true
});

/**
 * Дата документа
 * @property date
 * @type {Date}
 */
DocObj.prototype._define('date', {
	get : function(){ return this._obj.date || $p.blank.date},
	set : function(v){ this._obj.date = $p.fix_date(v, true)},
	enumerable : true
});

/**
 * Признак проведения
 * @property posted
 * @type {Boolean}
 */
DocObj.prototype._define('posted', {
	get : function(){ return this._obj.posted || false},
	set : function(v){ this._obj.posted = $p.fix_boolean(v)},
	enumerable : true
});



/**
 * Абстрактный ОбработкаОбъект
 * @class DataProcessorObj
 * @extends DataObj
 * @constructor
 * @param attr {Object} - объект с реквизитами в свойствах или строка guid ссылки
 * @param manager {DataManager}
 */
function DataProcessorObj(attr, manager) {

	// выполняем конструктор родительского объекта
	DataProcessorObj.superclass.constructor.call(this, attr, manager);

	var f, cmd = manager.metadata();
	for(f in cmd.fields)
		attr[f] = $p.fetch_type("", cmd.fields[f].type);
	for(f in cmd["tabular_sections"])
		attr[f] = [];

	this._mixin(attr);

	/**
	 * Освобождает память и уничтожает объект
	 * @method unload
	 */
	this.unload = function(){
		for(f in this){
			if(this[f] instanceof TabularSection){
				this[f].clear();
				delete this[f];
			}else if(typeof this[f] != "function"){
				delete this[f];
			}
		}
	};
}
DataProcessorObj._extend(DataObj);

/**
 * Абстрактный элемент перечисления
 * @class EnumObj
 * @extends DataObj
 * @constructor
 * @param attr {Object} - объект с реквизитами в свойствах или строка guid ссылки
 * @param manager {EnumManager}
 */
function EnumObj(attr, manager) {

	// выполняем конструктор родительского объекта
	EnumObj.superclass.constructor.call(this, attr, manager);

	if(attr && typeof attr == "object")
		this._mixin(attr);

}
EnumObj._extend(DataObj);


/**
 * Порядок элемента перечисления
 * @property order
 * @for EnumObj
 * @type Number
 */
EnumObj.prototype._define('order', {
	get : function(){ return this._obj.sequence},
	set : function(v){ this._obj.sequence = parseInt(v)},
	enumerable : true
});

/**
 * Наименование элемента перечисления
 * @property name
 * @for EnumObj
 * @type String
 */
EnumObj.prototype._define('name', {
	get : function(){ return this._obj.ref},
	set : function(v){ this._obj.ref = String(v)},
	enumerable : true
});

/**
 * Синоним элемента перечисления
 * @property synonym
 * @for EnumObj
 * @type String
 */
EnumObj.prototype._define('synonym', {
	get : function(){ return this._obj.synonym || ""},
	set : function(v){ this._obj.synonym = String(v)},
	enumerable : true
});

/**
 * Представление объекта
 * @property presentation
 * @for EnumObj
 * @type String
 */
EnumObj.prototype._define('presentation', {
	get : function(){
		return this.synonym || this.name;
	},
	enumerable : false
});

/**
 * Проверяет, является ли ссылка объекта пустой
 * @method empty
 * @for EnumObj
 * @return {boolean} - true, если ссылка пустая
 */
EnumObj.prototype.empty = function(){
	return this.ref == "_";
};


/**
 * Запись регистра (накопления и сведений)
 * @class RegisterRow
 * @extends DataObj
 * @constructor
 * @param attr {object} - объект, по которому запись будет заполнена
 * @param manager {InfoRegManager|AccumRegManager}
 */
function RegisterRow(attr, manager){

	// выполняем конструктор родительского объекта
	RegisterRow.superclass.constructor.call(this, attr, manager);

	if(attr && typeof attr == "object")
		this._mixin(attr);
}
RegisterRow._extend(DataObj);

/**
 * Метаданные текущего объекта
 * @property _metadata
 * @for DataObj
 * @type Object
 */
RegisterRow.prototype._define('_metadata', {
	get : function(){
		var cm = this._manager.metadata();
		if(!cm.fields)
			cm.fields = ({})._mixin(cm.dimensions)._mixin(cm.resources);
		return cm;
	},
	enumerable : false
});

RegisterRow.prototype._define('ref', {
	get : function(){ return this._manager.get_ref(this)},
	enumerable : true
});

/**
 * Дополняет классы {{#crossLink "DataObj"}}{{/crossLink}} и {{#crossLink "DataManager"}}{{/crossLink}} методами чтения,<br />
 * записи и синхронизации через стандартный интерфейс <a href="http://its.1c.ru/db/v83doc#bookmark:dev:TI000001362">OData</a>
 * /a/unf/odata/standard.odata
 * @module  metadata
 * @submodule rest
 * @author	Evgeniy Malyarov
 * @requires common
 */

function Rest(){

	this.filter_date = function (fld, dfrom, dtill) {
		if(!dfrom)
			dfrom = new Date("2015-01-01");
		var res = fld + " gt datetime'" + $p.dateFormat(dfrom, $p.dateFormat.masks.isoDateTime) + "'";
		if(dtill)
			res += " and " + fld + " lt datetime'" + $p.dateFormat(dtill, $p.dateFormat.masks.isoDateTime) + "'";
		return res;
	};

	this.to_data = function (rdata, mgr) {
		var o = {},
			mf = mgr.metadata().fields,
			mts = mgr.metadata().tabular_sections,
			ts, f, tf, row, syn, synts, vmgr;

		if(mgr instanceof RefDataManager){
			o.deleted = rdata.DeletionMark;
			o.data_version = rdata.DataVersion;
		}else{
			mf = []._mixin(mgr.metadata().dimensions)._mixin(mgr.metadata().resources);
		}

		if(mgr instanceof DocManager){
			o.number_doc = rdata.Number;
			o.date = rdata.Date;
			o.posted = rdata.Posted;

		} else {
			if(mgr.metadata().main_presentation_name)
				o.name = rdata.Description;

			if(mgr.metadata().code_length)
				o.id = rdata.Code;
		}

		for(f in mf){
			syn = _md.syns_1с(f);
			if(mf[f].type.is_ref && rdata[syn+"_Key"])
				syn+="_Key";
			o[f] = rdata[syn];
		}

		for(ts in mts){
			synts = _md.syns_1с(ts);
			o[ts] = [];
			rdata[synts].sort(function (a, b) {
				return a.LineNumber > b.LineNumber;
			});
			rdata[synts].forEach(function (r) {
				row = {};
				for(tf in mts[ts].fields){
					syn = _md.syns_1с(tf);
					if(mts[ts].fields[tf].type.is_ref && r[syn+"_Key"])
						syn+="_Key";
					row[tf] = r[syn];
				}
				o[ts].push(row);
			});
		}

		return o;
	};

	this.ajax_to_data = function (attr, mgr) {
		return $p.ajax.get_ex(attr.url, attr)
			.then(function (req) {
				return JSON.parse(req.response);
			})
			.then(function (res) {
				var data = [];
				res.value.forEach(function (rdata) {
					data.push(_rest.to_data(rdata, mgr));
				});
				return data;
			});
	}
}

var _rest = $p.rest = new Rest();


/**
 * Имя объектов этого менеджера для rest-запросов на сервер<br />
 * Идентификатор формируется по следующему принципу: ПрефиксИмени_ИмяОбъектаКонфигурации_СуффиксИмени
 * - Справочник  Catalog
 * - Документ    Document
 * - Журнал документов   DocumentJournal
 * - Константа   Constant
 * - План обмена ExchangePlan
 * - План счетов ChartOfAccounts
 * - План видов расчета  ChartOfCalculationTypes
 * - План видов характеристик    ChartOfCharacteristicTypes
 * - Регистр сведений    InformationRegister
 * - Регистр накопления  AccumulationRegister
 * - Регистр расчета CalculationRegister
 * - Регистр бухгалтерии AccountingRegister
 * - Бизнес-процесс  BusinessProcess
 * - Задача  Task
 * @property rest_name
 * @type String
 */
DataManager.prototype._define("rest_name", {
	get : function(suffix){
		var fp = this.class_name.split("."),
			csyn = {cat: "Catalog", doc: "Document", ireg: "InformationRegister", areg: "AccumulationRegister"};
		return csyn[fp[0]] + "_" + _md.syns_1с(fp[1]) + (suffix || "");
	},
	enumerable : false
});

/**
 * Загружает список объектов из rest-сервиса
 * @param attr {Object} - параметры сохранения
 * @param attr.[url] {String}
 * @param attr.[username] {String}
 * @param attr.[password] {String}
 * @param attr.[filter] {String} - строка условия отбора
 * @param attr.[top] {Number} - максимальное число загружаемых записей
 * @return {Promise.<T>} - промис с массивом загруженных объектов
 * @async
 */
DataManager.prototype.load_rest = function (attr) {

	$p.ajax.default_attr(attr, $p.job_prm.rest_url());
	attr.url += this.rest_name + "?allowedOnly=true&$format=json&$top=1000";
	//a/unf/odata/standard.odata/Document_ЗаказПокупателя?allowedOnly=true&$format=json&$select=Ref_Key,DataVersion

	return _rest.ajax_to_data(attr, this);

};

DataManager.prototype.rest_tree = function (attr) {

};

DataManager.prototype.rest_selection = function (attr) {

	var t = this,
		cmd = t.metadata(),
		flds = [],
		ares = [], o, ro, syn, mf,
		select = list_flds();


	function list_flds(){
		var s = "$select=Ref_Key,DeletionMark";

		if(cmd.form && cmd.form.selection){
			cmd.form.selection.fields.forEach(function (fld) {
				flds.push(fld);
			});

		}else if(t instanceof DocManager){
			flds.push("posted");
			flds.push("date");
			flds.push("number_doc");

		}else{

			if(cmd["hierarchical"] && cmd["group_hierarchy"])
				flds.push("is_folder");
			else
				flds.push("0 as is_folder");

			if(cmd["main_presentation_name"])
				flds.push("name as presentation");
			else{
				if(cmd["code_length"])
					flds.push("id as presentation");
				else
					flds.push("'...' as presentation");
			}

			if(cmd["has_owners"])
				flds.push("owner");

			if(cmd["code_length"])
				flds.push("id");

		}

		flds.forEach(function(fld){
			var parts;
			if(fld.indexOf(" as ") != -1){
				parts = fld.split(" as ")[0].split(".");
				if(parts.length == 1)
					fld = parts[0];
				else if(parts[0] != "_t_")
					return;
				else
					fld = parts[1]
			}
			syn = _md.syns_1с(fld);
			if(_md.get(t.class_name, fld).type.is_ref)
				syn += "_Key";
			s += "," + syn;
		});

		flds.push("ref");
		flds.push("deleted");

		return s;

	}

	$p.ajax.default_attr(attr, $p.job_prm.rest_url());
	attr.url += this.rest_name + "?allowedOnly=true&$format=json&$top=1000&" + select;

	attr.url += "&$filter=" + _rest.filter_date("Date", attr.date_from, attr.date_till);

	return $p.ajax.get_ex(attr.url, attr)
		.then(function (req) {
			return JSON.parse(req.response);
		})
		.then(function (res) {
			for(var i = 0; i < res.value.length; i++) {
				ro = res.value[i];
				o = {};
				flds.forEach(function (fld) {
					if(fld == "ref"){
						o[fld] = ro["Ref_Key"];
					}else{
						syn = _md.syns_1с(fld);
						mf = _md.get(t.class_name, fld);
						if(mf.type.is_ref)
							syn += "_Key";

						if(mf.type.date_part)
							o[fld] = $p.dateFormat(ro[syn], $p.dateFormat.masks[mf.type.date_part]);

						else if(mf.type.is_ref){
							if(!ro[syn] || ro[syn] == $p.blank.guid)
								o[fld] = "";
							else{
								var mgr	= _md.value_mgr(o, fld, mf.type, false, ro[syn]);
								if(mgr)
									o[fld] = mgr.get(ro[syn]).presentation;
								else
									o[fld] = "";
							}
						}else
							o[fld] = ro[syn];
					}
				});
				ares.push(o);
			}
			return data_to_grid.call(t, ares, attr);
		});

};

InfoRegManager.prototype.rest_slice_last = function(filter){

	if(!filter.period)
		filter.period = $p.date_add_day(new Date(), 1);

	var t = this,
		cmd = t.metadata(),
		period = "Period=datetime'" + $p.dateFormat(filter.period, $p.dateFormat.masks.isoDateTime) + "'",
		condition = "";

	for(var fld in cmd.dimensions){

		if(filter[fld] === undefined)
			continue;

		var syn = _md.syns_1с(fld);
		if(cmd.dimensions[fld].type.is_ref){
			syn += "_Key";
			if(condition)
				condition+= " and ";
			condition+= syn+" eq guid'"+filter[fld].ref+"'";
		}else{
			if(condition)
				condition+= " and ";

			if(cmd.dimensions[fld].type.digits)
				condition+= syn+" eq "+$p.fix_number(filter[fld]);

			else if(cmd.dimensions[fld].type.date_part)
				condition+= syn+" eq datetime'"+$p.dateFormat(filter[fld], $p.dateFormat.masks.isoDateTime)+"'";

			else
				condition+= syn+" eq '"+filter[fld]+"'";
		}

	}

	if(condition)
		period+= ",Condition='"+condition+"'";

	$p.ajax.default_attr(filter, $p.job_prm.rest_url());
	filter.url += this.rest_name + "/SliceLast(%sl)?allowedOnly=true&$format=json&$top=1000".replace("%sl", period);

	return _rest.ajax_to_data(filter, t)
		.then(function (data) {
			return t.load_array(data);
		});
};

/**
 * Сериализует объект данных в формат xml/atom (например, для rest-сервиса 1С)
 * @param [ex_meta] {Object} - метаданные внешней базы (например, УНФ).
 * Если указано, вывод ограничен полями, доступными во внешней базе + используются синонимы внешней базы
 */
DataObj.prototype.to_atom = function (ex_meta) {

	var res = '<entry><category term="StandardODATA.%n" scheme="http://schemas.microsoft.com/ado/2007/08/dataservices/scheme"/>\
				\n<title type="text"/><updated>%d</updated><author/><summary/><content type="application/xml">\
				\n<m:properties xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">\
			%p\
			\n</m:properties></content></entry>'
		.replace('%n', this._manager.rest_name)
		.replace('%d', $p.dateFormat(new Date(), $p.dateFormat.masks.atom)),

		prop = '\n<d:Ref_Key>' + this.ref + '</d:Ref_Key>' +
			'\n<d:DeletionMark>' + this.deleted + '</d:DeletionMark>' +
			'\n<d:DataVersion>' + this.data_version + '</d:DataVersion>',

		f, mf, fts, ts, mts, pname, v;

	function fields_to_atom(obj){
		var meta_fields = obj._metadata.fields,
			prefix = obj instanceof TabularSectionRow ? '\n\t<d:' : '\n<d:';

		for(f in meta_fields){
			mf = meta_fields[f];
			pname = _md.syns_1с(f);
			v = obj[f];
			if(v instanceof EnumObj)
				v = v.name;
			else if(v instanceof DataObj){
				pname+= '_Key';
				v = v.ref;
			}else if(mf.type.date_part)
				v = $p.dateFormat(v, $p.dateFormat.masks.atom);

			prop+= prefix + pname + '>' + v + '</d:' + pname + '>';
		}
	}

	if(this instanceof DocObj){
		prop+= '\n<d:Date>' + $p.dateFormat(this.date, $p.dateFormat.masks.atom) + '</d:Date>';
		prop+= '\n<d:Number>' + this.number_doc + '</d:Number>';

	} else {

		if(this._metadata.main_presentation_name)
			prop+= '\n<d:Description>' + this.name + '</d:Description>';

		if(this._metadata.code_length)
			prop+= '\n<d:Code>' + this.id + '</d:Code>';

		if(this._metadata.hierarchical && this._metadata.group_hierarchy)
			prop+= '\n<d:IsFolder>' + this.is_folder + '</d:IsFolder>';

	}

	fields_to_atom(this);

	for(fts in this._metadata.tabular_sections) {

		mts = this._metadata.tabular_sections[fts];
		//if(mts.hide)
		//	continue;

		pname = 'StandardODATA.' + this._manager.rest_name + '_' + _md.syns_1с(fts) + '_RowType';
		ts = this[fts];
		if(ts.count()){
			prop+= '\n<d:' + _md.syns_1с(fts) + ' m:type="Collection(' + pname + ')">';

			ts.each(function (row) {
				prop+= '\n\t<d:element m:type="' + pname + '">';
				prop+= '\n\t<d:LineNumber>' + row.row + '</d:LineNumber>';
				fields_to_atom(row);
				prop+= '\n\t</d:element>';
			});

			prop+= '\n</d:' + _md.syns_1с(fts) + '>';

		}else
			prop+= '\n<d:' + _md.syns_1с(fts) + ' m:type="Collection(' + pname + ')" />';
	}

	return res.replace('%p', prop);

	//<d:DeletionMark>false</d:DeletionMark>
	//<d:Ref_Key>213d87ad-33d5-11de-b58f-00055d80a2b8</d:Ref_Key>
	//<d:IsFolder>false</d:IsFolder>
	//<d:Description>Новая папка</d:Description>
	//<d:Запасы m:type="Collection(StandardODATA.Document_ЗаказПокупателя_Запасы_RowType)">
	//	<d:element m:type="StandardODATA.Document_ЗаказПокупателя_Запасы_RowType">
	//		<d:LineNumber>1</d:LineNumber>
	//		<d:Номенклатура_Key>6ebf3bf7-3565-11de-b591-00055d80a2b9</d:Номенклатура_Key>
	//		<d:ТипНоменклатурыЗапас>true</d:ТипНоменклатурыЗапас>
	//		<d:Характеристика_Key>00000000-0000-0000-0000-000000000000</d:Характеристика_Key>
	//		<d:ПроцентАвтоматическойСкидки>0</d:ПроцентАвтоматическойСкидки>
	//		<d:СуммаАвтоматическойСкидки>0</d:СуммаАвтоматическойСкидки>
	//		<d:КлючСвязи>0</d:КлючСвязи>
	//	</d:element>
	//</d:Запасы>
	//<d:МатериалыЗаказчика m:type="Collection(StandardODATA.Document_ЗаказПокупателя_МатериалыЗаказчика_RowType)"/>
};

/**
 * Сохраняет объект в базе rest-сервиса
 * @param attr {Object} - параметры сохранения
 * @param attr.url {String}
 * @param attr.username {String}
 * @param attr.password {String}
 * @param attr.[post] {Boolean|undefined} - проведение или отмена проведения или просто запись
 * @param attr.[operational] {Boolean} - режим проведения документа [Оперативный, Неоперативный]
 * @return {Promise.<T>}
 * @async
 */
DataObj.prototype.save_rest = function (attr) {

	attr.url += this._manager.rest_name;

	// проверяем наличие ссылки в базе приёмника



	//HTTP-заголовок 1C_OData_DataLoadMode=true
	//Post?PostingModeOperational=false.
	return Promise.resolve(this);

};

/**
 * Читает объект из rest-сервиса
 * @return {Promise.<T>} - промис с загруженным объектом
 */
DataObj.prototype.load_rest = function () {

	var attr = {},
		tObj = this;
	$p.ajax.default_attr(attr, $p.job_prm.rest_url());
	attr.url += tObj._manager.rest_name + "(guid'" + tObj.ref + "')?$format=json";

	return $p.ajax.get_ex(attr.url, attr)
		.then(function (req) {
			return JSON.parse(req.response);
		})
		.then(function (res) {
			return tObj._mixin(_rest.to_data(res, tObj._manager));
		})
		.catch(function (err) {
			if(err.status==404)
				return tObj;
			else
				console.log(err);
		});
};/**
 * Содержит методы обработки событий __при запуске__ программы, __перед закрытием__,<br />
 * при обновлении файлов __ApplicationCache__, а так же, при переходе в __offline__ и __online__
 *
 *	События развиваются в такой последовательности:
 *
 *	1) выясняем, совместим ли браузер. В зависимости от параметров url и параметров по умолчанию,
 *	 может произойти переход в ChromeStore или другие действия
 *
 *	2) анализируем AppCache, при необходимости обновляем скрипты и перезагружаем страницу
 *
 * 	3) инициализируем $p.wsql и комбинируем параметры работы программы с параметрами url
 *
 * 	4) если режим работы предполагает использование построителя, подключаем слушатель его событий.
 *	 по событию построителя "ready", выполняем метод initMainLayout() объекта $p.iface.
 *	 Метод initMainLayout() переопределяется во внешним, по отношению к ядру, модуле
 *
 * @module common
 * @submodule events
 */

/**
 * Этот фрагмент кода выполняем только в браузере
 * События окна внутри воркера и Node нас не интересуют
 */
if(typeof window !== "undefined"){
	(function (w) {

		var eve = $p.eve,
			iface = $p.iface,
			msg = $p.msg,
			stepper = {},
			timer_setted = false,
			cache;

		/**
		 * Устанавливает состояние online/offline в параметрах работы программы
		 * @method set_offline
		 * @for AppEvents
		 * @param offline {Boolean}
		 */
		eve.set_offline = function(offline){
			var current_offline = $p.job_prm['offline'];
			$p.job_prm['offline'] = !!(offline || $p.wsql.get_user_param('offline', 'boolean'));
			if(current_offline != $p.job_prm['offline']){
				// предпринять действия
				current_offline = $p.job_prm['offline'];

			}
		};

		w.addEventListener('online', eve.set_offline);
		w.addEventListener('offline', function(){eve.set_offline(true);});

		w.addEventListener('load', function(){

			function do_reload(){
				if(!$p.ajax.authorized){
					eve.redirect = true;
					location.reload(true);
				}
			}

			function do_cache_update_msg(e){

				if(!stepper.wnd_appcache && $p.iface.appcache)
					$p.iface.appcache.create(stepper);

				else if(!timer_setted){
					timer_setted = true;
					setTimeout(do_reload, 25000);
				}

				if($p.iface.appcache){
					stepper.loaded = e.loaded || 0;
					stepper.total = e.total || 140;
					$p.iface.appcache.update();
				}

				if(stepper.do_break){
					$p.iface.appcache.close();
					setTimeout(do_reload, 1000);
				}
			}

			/**
			 * Нулевым делом, создаём объект параметров работы программы, в процессе создания которого,
			 * выполняется клиентский скрипт, переопределяющий триггеры и переменные окружения
			 * Параметры имеют значения по умолчанию, могут переопределяться подключаемыми модулями
			 * и параметрами url, синтаксический разбор url производим сразу
			 * @property job_prm
			 * @for MetaEngine
			 * @type JobPrm
			 * @static
			 */
			$p.job_prm = new JobPrm();

			/**
			 * если в $p.job_prm указано использование геолокации, геокодер инициализируем с небольшой задержкой
			 */
			if (navigator.geolocation && $p.job_prm.use_google_geo) {

				/**
				 * Данные геолокации
				 * @property ipinfo
				 * @type IPInfo
				 * @static
				 */
				$p.ipinfo = new function IPInfo(){

					var _yageocoder, _ggeocoder, _addr = "";

					/**
					 * Геокодер карт Яндекс
					 * @class YaGeocoder
					 * @static
					 */
					function YaGeocoder(){

						/**
						 * Выполняет прямое или обратное геокодирование
						 * @method geocode
						 * @param attr {Object}
						 * @return {Promise.<T>}
						 */
						this.geocode = function (attr) {
							//http://geocode-maps.yandex.ru/1.x/?geocode=%D0%A7%D0%B5%D0%BB%D1%8F%D0%B1%D0%B8%D0%BD%D1%81%D0%BA,+%D0%9F%D0%BB%D0%B5%D1%85%D0%B0%D0%BD%D0%BE%D0%B2%D0%B0+%D1%83%D0%BB%D0%B8%D1%86%D0%B0,+%D0%B4%D0%BE%D0%BC+32&format=json&sco=latlong
							//http://geocode-maps.yandex.ru/1.x/?geocode=61.4080273,55.1550362&format=json&lang=ru_RU

							return Promise.resolve(false);
						}
					}

					/**
					 * Объект геокодера yandex
					 * https://tech.yandex.ru/maps/doc/geocoder/desc/concepts/input_params-docpage/
					 * @property yageocoder
					 * @for IPInfo
					 * @type YaGeocoder
					 */
					this._define("yageocoder", {
						get : function(){

							if(!_yageocoder)
								_yageocoder = new YaGeocoder();
							return _yageocoder;
						},
						enumerable : false,
						configurable : false});


					/**
					 * Объект геокодера google
					 * https://developers.google.com/maps/documentation/geocoding/?hl=ru#GeocodingRequests
					 * @property ggeocoder
					 * @for IPInfo
					 * @type {google.maps.Geocoder}
					 */
					this._define("ggeocoder", {
							get : function(){
								return _ggeocoder;
							},
							enumerable : false,
							configurable : false}
					);

					/**
					 * Адрес геолокации пользователя программы
					 * @property addr
					 * @for IPInfo
					 * @type String
					 */
					this._define("addr", {
							get : function(){
								return _addr;
							},
							enumerable : true,
							configurable : false}
					);

					this.location_callback= function(){

						/**
						 * Объект геокодера google
						 * https://developers.google.com/maps/documentation/geocoding/?hl=ru#GeocodingRequests
						 * @property ggeocoder
						 * @for IPInfo
						 * @type {google.maps.Geocoder}
						 */
						_ggeocoder = new google.maps.Geocoder();

						navigator.geolocation.getCurrentPosition(function(position){

								/**
								 * Географическая широта геолокации пользователя программы
								 * @property latitude
								 * @for IPInfo
								 * @type Number
								 */
								$p.ipinfo.latitude = position.coords.latitude;

								/**
								 * Географическая долгота геолокации пользователя программы
								 * @property longitude
								 * @for IPInfo
								 * @type Number
								 */
								$p.ipinfo.longitude = position.coords.longitude;

								var latlng = new google.maps.LatLng($p.ipinfo.latitude, $p.ipinfo.longitude);

								_ggeocoder.geocode({'latLng': latlng}, function(results, status) {
									if (status == google.maps.GeocoderStatus.OK){
										if(!results[1] || results[0].address_components.length >= results[1].address_components.length)
											_addr = results[0].formatted_address;
										else
											_addr = results[1].formatted_address;
									}
								});

							}, function(err){
								if(err)
									$p.ipinfo.err = err.message;
							}, {
								timeout: 30000
							}
						);
					}
				};

				// подгружаем скрипты google
				if(!window.google || !window.google.maps)
					$p.eve.onload.push(function () {
						setTimeout(function(){
							$p.load_script(location.protocol +
								"//maps.google.com/maps/api/js?sensor=false&callback=$p.ipinfo.location_callback", "script", function(){});
						}, 100);
					});
				else
					location_callback();
			}


			// создавать dhtmlXWindows можно только после готовности документа
			if("dhtmlx" in w){
				$p.iface.w = new dhtmlXWindows();
				$p.iface.w.setSkin(dhtmlx.skin);
			}

			// проверяем совместимость браузера
			if($p.job_prm.check_browser_compatibility && (!w.JSON || !w.indexedDB || !w.localStorage) ){
				eve.redirect = true;
				msg.show_msg({type: "alert-error", text: msg.unsupported_browser, title: msg.unsupported_browser_title});
				setTimeout(function(){ location.replace(msg.store_url_od); }, 6000);
				return;
			}

			// проверяем установленность приложения только если мы внутри хрома
			if($p.job_prm.check_app_installed && w["chrome"] && w["chrome"]["app"] && !w["chrome"]["app"]["isInstalled"]){
				if(!location.hostname.match(/.local/)){
					eve.redirect = true;
					msg.show_msg({type: "alert-error", text: msg.unsupported_mode, title: msg.unsupported_mode_title});
					setTimeout(function(){ location.replace(msg.store_url_od); }, 6000);
					return;
				}
			}

			/**
			 * Инициализируем параметры пользователя,
			 * проверяем offline и версию файлов
			 */
			setTimeout(function(){
				$p.wsql.init_params(function(){

					eve.set_offline(!navigator.onLine);

					eve.update_files_version();

					// пытаемся перейти в полноэкранный режим в мобильных браузерах
					if (document.documentElement.webkitRequestFullScreen && navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
						function requestFullScreen(){
							document.documentElement.webkitRequestFullScreen();
							w.removeEventListener('touchstart', requestFullScreen);
						}
						w.addEventListener('touchstart', requestFullScreen, false);
					}

					// кешируем ссылки на элементы управления
					if($p.job_prm.use_builder || $p.job_prm.use_wrapper){
						$p.wrapper	= document.getElementById("owb_wrapper");
						$p.risdiv	= document.getElementById("risdiv");
						$p.ft		= document.getElementById("msgfooter");
						if($p.ft)
							$p.ft.style.display = "none";
					}

					/**
					 * Выполняем отложенные методы из eve.onload
					 */
					eve.onload.forEach(function (method) {
						if(typeof method === "function")
							method();
					});

					// Если есть сплэш, удаляем его
					if(document && document.querySelector("#splash"))
						document.querySelector("#splash").parentNode.removeChild(document.querySelector("#splash"));

					/**
					 *	начинаем слушать события msgfooter-а, в который их пишет рисовалка
					 */
					if($p.job_prm.use_builder && $p.ft){

						dhtmlxEvent($p.ft, "click", function(evt){
							$p.cancel_bubble(evt);
							if(evt.qualifier == "ready")
								iface.oninit();
							else if($p.eve.builder_click)
								$p.eve.builder_click(evt);
						});

					}else
						setTimeout(iface.oninit, 100);


					// Ресурсы уже кэшированнны. Индикатор прогресса скрыт
					if (cache = w.applicationCache){

						// обновление не требуется
						cache.addEventListener('noupdate', function(e){

						}, false);

						// Ресурсы уже кэшированнны. Индикатор прогресса скрыт.
						cache.addEventListener('cached', function(e){
							timer_setted = true;
							if($p.iface.appcache)
								$p.iface.appcache.close();
						}, false);

						// Начало скачивания ресурсов. progress_max - количество ресурсов. Показываем индикатор прогресса
						cache.addEventListener('downloading', do_cache_update_msg, false);

						// Процесс скачивания ресурсов. Индикатор прогресса изменяется
						cache.addEventListener('progress', do_cache_update_msg,	false);

						// Скачивание завершено. Скрываем индикатор прогресса. Обновляем кэш. Перезагружаем страницу.
						cache.addEventListener('updateready', function(e) {
							try{
								cache.swapCache();
								if($p.iface.appcache){
									$p.iface.appcache.close();
								}
							}catch(e){}
							do_reload();
						}, false);

						// Ошибка кеша
						cache.addEventListener('error', function(e) {
							if(!w.JSON || !w.openDatabase || typeof(w.openDatabase) !== 'function'){
								//msg.show_msg({type: "alert-error",
								//	text: msg.unknown_error.replace("%1", "applicationCache"),
								//	title: msg.main_title});
							}else
								msg.show_msg({type: "alert-error", text: e.message || msg.unknown_error, title: msg.error_critical});

						}, false);
					}

				});
			}, 100);


		}, false);

		/**
		 * Обработчик события "перед закрытием окна"
		 * @event onbeforeunload
		 * @for AppEvents
		 * @returns {string} - если не путсто, браузер показывает диалог с вопросом, можно ли закрывать
		 */
		w.onbeforeunload = function(){
			if(!eve.redirect)
				return msg.onbeforeunload;
		};

		/**
		 * Обработчик back/forward событий браузера
		 * @event popstat
		 * @for AppEvents
		 */
		w.addEventListener("popstat", $p.iface.hash_route);

		/**
		 * Обработчик события изменения hash в url
		 * @event hashchange
		 * @for AppEvents
		 */
		w.addEventListener("hashchange", $p.iface.hash_route);

	})(window);
}


/**
 * Шаги синхронизации (перечисление состояний)
 * @property steps
 * @for AppEvents
 * @type SyncSteps
 */
$p.eve.steps = {
	load_meta: 0,           // загрузка метаданных из файла
	authorization: 1,       // авторизация на сервере 1С или Node (в автономном режиме шаг не выполняется)
	create_managers: 2,     // создание менеджеров объектов
	process_access:  3,     // загрузка данных пользователя, обрезанных по RLS (контрагенты, договоры, организации)
	load_data_files: 4,     // загрузка данных из файла зоны
	load_data_db: 5,        // догрузка данных с сервера 1С или Node
	load_data_wsql: 6,      // загрузка данных из локальной датабазы (имеет смысл, если локальная база не в ОЗУ)
	save_data_wsql: 7       // кеширование данных из озу в локальную датабазу
};

$p.eve.stepper = {
	step: 0,
	count_all: 0,
	cat_date: 0,
	step_size: 57,
	files: 0,
	cat_ini_date: $p.wsql.get_user_param("cache_cat_date", "number")  || 0
};

/**
 * Регламентные задания синхронизапции каждые 3 минуты
 * @event ontimer
 * @for AppEvents
 */
$p.eve.ontimer = function () {

	// читаем файл версии файлов js. в случае изменений, оповещаем пользователя
	// TODO сделать автообновление
	$p.eve.update_files_version();

};
setInterval($p.eve.ontimer, 180000);

$p.eve.update_files_version = function () {

	if(!$p.job_prm || $p.job_prm.offline || !$p.job_prm.data_url)
		return;

	if(!$p.job_prm.files_date)
		$p.job_prm.files_date = $p.wsql.get_user_param("files_date", "number");

	// проверяем состояние и пытаемся установить ws соединение с Node
	if($p.job_prm.ws_url){
		if(!$p.eve.ws || !$p.eve.ws_opened){
			try{
				$p.eve.ws = new WebSocket($p.job_prm.ws_url);

				$p.eve.ws.onopen = function() {
					$p.eve.ws_opened = true;
					$p.eve.ws.send(JSON.stringify({
						zone: $p.wsql.get_user_param("zone"),
						browser_uid: $p.wsql.get_user_param("browser_uid")
					}));
				};

				$p.eve.ws.onclose = function() {
					$p.eve.ws_opened = false;
				};

				$p.eve.ws.onmessage = function(ev) {
					try{
						var data = JSON.parse(ev.data);
						console.log(data);

					}catch(err){
						console.log(err);
					}
				};

				$p.eve.ws.onerror = function(err) {
					console.log(err);
				};

			}catch(err){
				console.log(err);
			}
		}
	}


	$p.ajax.get($p.job_prm.data_url + "sync.json?v="+Date.now())
		.then(function (req) {
			var sync = JSON.parse(req.response);

			if(!$p.job_prm.confirmation && $p.job_prm.files_date != sync.files_date){

				$p.wsql.set_user_param("files_date", sync.files_date);

				$p.job_prm.confirmation = true;

				dhtmlx.confirm({
					title: $p.msg.file_new_date_title,
					text: $p.msg.file_new_date,
					ok: "Перезагрузка",
					cancel: "Продолжить",
					callback: function(btn) {

						delete $p.job_prm.confirmation;

						if(btn){
							$p.eve.redirect = true;
							location.reload(true);
						}
					}
				});
			}
		}).catch(function (err) {
			console.log(err);
		})
};


/**
 * Читает порцию данных из веб-сервиса обмена данными
 * @method pop
 * @for AppEvents
 * @param write_ro_wsql {Boolean} - указывает сразу кешировать прочитанные данные в wsql
 */
$p.eve.pop = function (write_ro_wsql) {

	var cache_cat_date = $p.eve.stepper.cat_ini_date;

	// запрашиваем очередную порцию данных в 1С
	function get_cachable_portion(step){

		return _load({
			action: "get_cachable_portion",
			cache_cat_date: cache_cat_date,
			step_size: $p.eve.stepper.step_size,
			step: step || 0
		});
	}

	function update_cache_cat_date(need){
		if($p.eve.stepper.cat_ini_date > $p.wsql.get_user_param("cache_cat_date", "number"))
			$p.wsql.set_user_param("cache_cat_date", $p.eve.stepper.cat_ini_date);
		if(need)
			setTimeout(function () {
				$p.eve.pop(true);
			}, 10000);
	}

	if($p.job_prm.offline)
		return Promise.resolve(false);
	else if($p.job_prm.rest)
		return Promise.resolve(false);

	// за такт pop делаем не более 2 запросов к 1С
	return get_cachable_portion()

		// загружаем в ОЗУ данные первого запроса
		.then(function (req) {
			return $p.eve.from_json_to_data_obj(req, write_ro_wsql);
		})

		.then(function (need) {
			if(need){
				return get_cachable_portion(1)

					.then(function (req) {
						return $p.eve.from_json_to_data_obj(req, write_ro_wsql);
					})

					.then(function (need){
						update_cache_cat_date(need);
					});
			}
			update_cache_cat_date(need);
		});
};

/**
 * Записывает порцию данных в веб-сервис обмена данными
 * @method push
 * @for AppEvents
 */
$p.eve.push = function () {

};

$p.eve.from_json_to_data_obj = function(res) {

	var stepper = $p.eve.stepper, class_name;

	if (typeof res == "string")
		res = JSON.parse(res);
	else if(res instanceof XMLHttpRequest){
		if(res.response)
			res = JSON.parse(res.response);
		else
			res = {};
	}

	if(stepper.do_break){
		$p.iface.sync.close();
		$p.eve.redirect = true;
		location.reload(true);

	}else if(res["cat_date"] || res.force){
		if(res["cat_date"] > stepper.cat_ini_date)
			stepper.cat_ini_date = res["cat_date"];
		if(res["cat_date"] > stepper.cat_date)
			stepper.cat_date = res["cat_date"];
		if(res["count_all"])
			stepper.count_all = res["count_all"];
		if(res["current"])
			stepper.current = res["current"];

		for(class_name in res.cch)
			_cch[class_name].load_array(res.cch[class_name]);

		for(class_name in res.cacc)
			_cacc[class_name].load_array(res.cacc[class_name]);

		for(class_name in res.cat)
			_cat[class_name].load_array(res.cat[class_name]);

		for(class_name in res.doc)
			_doc[class_name].load_array(res.doc[class_name]);

		for(class_name in res.ireg)
			_ireg[class_name].load_array(res.ireg[class_name]);

		for(class_name in res.areg)
			_areg[class_name].load_array(res.areg[class_name]);

		// если все данные получены в первом запросе, второй можно не делать
		return res.current && (res.current >= stepper.step_size);
	}
};

// возаращает промис после выполнения всех заданий в очереди
$p.eve.reduce_promices = function(parts){

	return parts.reduce(function(sequence, part_promise) {

		// Используем редуцирование что бы связать в очередь обещания, и добавить каждую главу на страницу
		return sequence.then(function() {
			return part_promise;

		})
			// загружаем все части в озу
			.then($p.eve.from_json_to_data_obj);

	}, Promise.resolve())
};

/**
 * Запускает процесс входа в программу и начальную синхронизацию
 * @method log_in
 * @for AppEvents
 * @param onstep {function} - callback обработки состояния. Функция вызывается в начале шага
 * @return {Promise.<T>} - промис, ошибки которого должен обработать вызывающий код
 * @async
 */
$p.eve.log_in = function(onstep){

	var stepper = $p.eve.stepper,
		mdd, data_url = $p.job_prm.data_url || "/data/";

	// информируем о начале операций
	onstep($p.eve.steps.load_meta);

	// читаем файл метаданных
	return $p.ajax.get(data_url + "meta.json?v="+$p.job_prm.files_date)

		// грузим метаданные
		.then(function (req) {
			onstep($p.eve.steps.create_managers);

			// пытаемся загрузить патч метаданных
			return $p.ajax.get(data_url + "meta_patch.json?v="+$p.job_prm.files_date)
				.then(function (rep) {
					return new Meta(req, rep);
				})
				.catch(function () {
					return new Meta(req);
				});
		})

		// авторизуемся на сервере. в автономном режиме сразу переходим к чтению первого файла данных
		.then(function (res) {

			onstep($p.eve.steps.authorization);

			if($p.job_prm.offline)
				return res;

			else if($p.job_prm.rest){
				// в режиме rest тестируем авторизацию
				// TODO: реализовать метод для получения списка ролей пользователя
				return $p.ajax.get_ex($p.job_prm.rest_url()+"?$format=json", true)
					.then(function (req) {
						//return JSON.parse(res.response);
						return {root: true};
					});

			}else
				return _load({
					action: "get_meta",
					cache_md_date: $p.wsql.get_user_param("cache_md_date", "number"),
					cache_cat_date: stepper.cat_ini_date,
					now_js: Date.now(),
					margin: $p.wsql.get_user_param("margin", "number"),
					ipinfo: $p.ipinfo.hasOwnProperty("latitude") ? JSON.stringify($p.ipinfo) : ""
				})
		})

		// обработчик ошибок авторизации
		.catch(function (err) {

			if($p.iface.auth.onerror)
				$p.iface.auth.onerror(err);

			throw err;
		})

		// интерпретируем ответ сервера
		.then(function (res) {

			onstep($p.eve.steps.load_data_files);

			if($p.job_prm.offline)
				return res;

			$p.ajax.authorized = true;

			if(typeof res == "string")
				res = JSON.parse(res);

			if($p.msg.check_soap_result(res))
				return;

			if($p.wsql.get_user_param("enable_save_pwd"))
				$p.wsql.set_user_param("user_pwd", $p.ajax.password);
			else if($p.wsql.get_user_param("user_pwd"))
				$p.wsql.set_user_param("user_pwd", "");

			// обрабатываем поступившие данные
			$p.wsql.set_user_param("time_diff", res["now_1с"] - res["now_js"]);
			if(res.cat && res.cat["clrs"])
				_md.get("cat.clrs").predefined.white.ref = res.cat["clrs"].predefined.white.ref;
			if(res.cat && res.cat["bases"])
				_md.get("cat.bases").predefined.main.ref = res.cat["bases"].predefined.main.ref;

			return res;
		})

		// сохраняем даты справочников в mdd и читаем первый файл данных
		.then(function(res){

			mdd = res;

			stepper.zone = ($p.job_prm.demo ? "1" : $p.wsql.get_user_param("zone")) + "/";

			return $p.ajax.get(data_url + "zones/" + stepper.zone + "p_0.json?v="+$p.job_prm.files_date)
		})

		// из содержимого первого файла получаем количество файлов и загружаем их все
		.then(function (req) {

			var tmpres = JSON.parse(req.response);
			stepper.files = tmpres.files-1;
			stepper.step_size = tmpres.files > 0 ? Math.round(tmpres.count_all / tmpres.files) : 57;
			stepper.cat_ini_date = tmpres["cat_date"];
			$p.eve.from_json_to_data_obj(tmpres);

		})

		// формируем массив url файлов данных зоны
		.then(function () {

			var parts = [];
			for(var i=1; i<=stepper.files; i++)
				parts.push($p.ajax.get(data_url + "zones/" + stepper.zone + "p_" + i + ".json?v="+$p.job_prm.files_date));
			parts.push($p.ajax.get(data_url + "zones/" + stepper.zone + "ireg.json?v="+$p.job_prm.files_date));

			return $p.eve.reduce_promices(parts);

		})

		// если онлайн, выполняем такт обмена с 1С
		.then(function(parts) {

			onstep($p.eve.steps.load_data_db);
			stepper.step_size = 57;
			return $p.eve.pop();
		})

		// читаем справочники с ограниченным доступом, которые могли прибежать вместе с метаданными
		.then(function () {

			if(mdd.access){
				mdd.access.force = true;
				$p.eve.from_json_to_data_obj(mdd.access);
			}

			// здесь же, уточняем список печатных форм и
			_md.printing_plates(mdd.printing_plates);

			// и запоминаем в ajax признак полноправности пользователя
			$p.ajax._define("root", {
				value: !!mdd.root,
				writable: false,
				enumerable: false
			});
		})

		// сохраняем данные в локальной датабазе
		.then(function () {
			onstep($p.eve.steps.save_data_wsql);
			//for(var cat_name in _cat){
			//	if(!(_cat[cat_name] instanceof CatManager))
			//		continue;
			//	_cat[cat_name].save_wsql();
			//}
		});

};