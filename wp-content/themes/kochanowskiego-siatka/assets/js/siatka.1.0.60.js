/* Kochanowskiego · Siatka: panele menu (klik), menu mobilne. */
(function () {
	'use strict';

	// Panele nawigacji desktopowej: jeden otwarty naraz; Esc i klik poza nagłówkiem zamykają.
	var przyciski = document.querySelectorAll('.sg-nav__link[aria-controls]');
	function zamknijPanele(wyjatek) {
		przyciski.forEach(function (b) {
			if (b === wyjatek) return;
			b.setAttribute('aria-expanded', 'false');
			var p = document.getElementById(b.getAttribute('aria-controls'));
			if (p) p.hidden = true;
		});
	}
	przyciski.forEach(function (b) {
		b.addEventListener('click', function () {
			var otwarty = b.getAttribute('aria-expanded') === 'true';
			zamknijPanele(b);
			b.setAttribute('aria-expanded', String(!otwarty));
			document.getElementById(b.getAttribute('aria-controls')).hidden = otwarty;
		});
	});
	document.addEventListener('click', function (e) {
		if (!e.target.closest('.sg-naglowek')) zamknijPanele();
	});
	document.addEventListener('keydown', function (e) {
		if (e.key !== 'Escape') return;
		var otwarty = document.querySelector('.sg-nav__link[aria-expanded="true"]');
		if (otwarty) {
			zamknijPanele();
			otwarty.focus();
		}
		if (mmenu && !mmenu.hidden) zamknijMenu();
	});

	// Menu mobilne (pełny ekran).
	var mmenu = document.getElementById('sg-mmenu');
	var otworz = document.querySelector('.sg-naglowek__gora .sg-naglowek__menu');
	var zamknij = mmenu && mmenu.querySelector('.sg-mmenu__zamknij');
	function zamknijMenu() {
		mmenu.hidden = true;
		otworz.setAttribute('aria-expanded', 'false');
		document.documentElement.classList.remove('sg-bez-przewijania');
		otworz.focus();
	}
	if (mmenu && otworz && zamknij) {
		otworz.addEventListener('click', function () {
			mmenu.hidden = false;
			otworz.setAttribute('aria-expanded', 'true');
			document.documentElement.classList.add('sg-bez-przewijania');
			zamknij.focus();
		});
		zamknij.addEventListener('click', zamknijMenu);
		mmenu.querySelectorAll('.sg-mmenu__wiersz > button').forEach(function (b) {
			b.addEventListener('click', function () {
				var otwarty = b.getAttribute('aria-expanded') === 'true';
				b.setAttribute('aria-expanded', String(!otwarty));
				document.getElementById(b.getAttribute('aria-controls')).hidden = otwarty;
			});
		});
	}
})();

/**
 * Status otwarcia przychodni (liczony w przeglądarce, czas Europe/Warsaw — cache HTML jest bezpieczny),
 * dzisiejszy dzień w tabeli godzin, przenikanie zdjęć na pierwszym ekranie i wejście sekcji strony głównej.
 */
(function () {
	'use strict';
	var DNI = ['w niedzielę', 'w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę'];
	var bezRuchu = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	function fmt(m) { return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
	function teraz() {
		var o = {};
		new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
			.formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
		return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), m: (+o.hour % 24) * 60 + (+o.minute), data: o.year + '-' + o.month + '-' + o.day };
	}
	// Dni ustawowo wolne od pracy w Polsce (stałe + ruchome od Wielkanocy); opcja koch_swieta dokłada dni dodatkowe.
	var swietaRoku = {};
	function dwie(x) { return ('0' + x).slice(-2); }
	function swieta(rok) {
		if (swietaRoku[rok]) return swietaRoku[rok];
		var a = rok % 19, b = Math.floor(rok / 100), c = rok % 100, d = Math.floor(b / 4), e = b % 4,
			f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
			i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
			mies = Math.floor((h + l - 7 * m + 114) / 31), dzien = ((h + l - 7 * m + 114) % 31) + 1;
		var wielkanoc = Date.UTC(rok, mies - 1, dzien);
		var lista = ['01-01', '01-06', '05-01', '05-03', '08-15', '11-01', '11-11', '12-24', '12-25', '12-26'].map(function (s) { return rok + '-' + s; });
		[0, 1, 49, 60].forEach(function (dni) { // Wielkanoc, Poniedziałek Wielkanocny, Zielone Świątki, Boże Ciało
			lista.push(new Date(wielkanoc + dni * 864e5).toISOString().slice(0, 10));
		});
		return (swietaRoku[rok] = lista);
	}
	function toSwieto(data, cfg) {
		return swieta(+data.slice(0, 4)).indexOf(data) !== -1 || (cfg.s || []).indexOf(data) !== -1;
	}
	function status(cfg) {
		var n = teraz(), swieto = toSwieto(n.data, cfg), h = swieto ? null : cfg.h[n.d];
		if (h && n.m >= h[0] && n.m < h[1]) {
			var z = h[1] - n.m;
			return z <= 30 ? { stan: 'soon', tekst: 'zamykamy za ' + z + ' min (o ' + fmt(h[1]) + ')' } : { stan: 'open', tekst: 'otwarte teraz, do ' + fmt(h[1]) };
		}
		if (h && n.m < h[0]) return { stan: 'closed', tekst: 'zamknięte, otwieramy dziś o ' + fmt(h[0]) };
		var zamkniete = swieto ? 'zamknięte (święto)' : 'zamknięte';
		var dzis = Date.UTC(+n.data.slice(0, 4), +n.data.slice(5, 7) - 1, +n.data.slice(8, 10));
		for (var i = 1; i <= 10; i++) {
			var d = (n.d + i) % 7, data = new Date(dzis + i * 864e5).toISOString().slice(0, 10);
			if (cfg.h[d] && !toSwieto(data, cfg)) return { stan: 'closed', tekst: zamkniete + ', otwieramy ' + (i === 1 ? 'jutro' : i < 7 ? DNI[d] : dwie(+data.slice(8, 10)) + '.' + data.slice(5, 7)) + ' o ' + fmt(cfg.h[d][0]) };
		}
		return { stan: 'closed', tekst: zamkniete };
	}
	function odswiez() {
		document.querySelectorAll('.koch-status[data-hours]').forEach(function (el) {
			var cfg;
			try { cfg = JSON.parse(el.getAttribute('data-hours')); } catch (e) { return; }
			var s = status(cfg), nazwa = el.getAttribute('data-nazwa');
			var tekst = nazwa ? nazwa + ': ' + s.tekst : s.tekst.charAt(0).toUpperCase() + s.tekst.slice(1);
			if (el.textContent === tekst) return;
			el.setAttribute('data-stan', s.stan);
			el.textContent = tekst;
		});
		var d = teraz().d;
		document.querySelectorAll('.koch-godziny tr[data-dzien]').forEach(function (tr) {
			tr.classList.toggle('is-dzis', +tr.getAttribute('data-dzien') === d);
		});
	}
	odswiez();
	setInterval(function () { if (!document.hidden) odswiez(); }, 60000);

	// Pierwszy ekran: trzy kadry „lekarz z małym pacjentem” przenikają się co 6 s.
	var kadry = document.querySelectorAll('.sg-hero__foto figure');
	if (kadry.length > 1 && !bezRuchu) {
		// Kadry 2 i 3 są ukryte (display: none) i leniwe — pobierają się dopiero po dodaniu klasy, już po załadowaniu strony.
		var foto = document.querySelector('.sg-hero__foto');
		var wczytajKadry = function () { foto.classList.add('sg-kadry'); };
		if (document.readyState === 'complete') setTimeout(wczytajKadry, 800);
		else window.addEventListener('load', function () { setTimeout(wczytajKadry, 800); });
		var nr = 0;
		kadry[0].classList.add('is-on');
		document.querySelector('.sg-hero__foto').classList.add('sg-przenikanie');
		setInterval(function () {
			if (document.hidden) return;
			kadry[nr].classList.remove('is-on');
			nr = (nr + 1) % kadry.length;
			kadry[nr].classList.add('is-on');
		}, 6000);
	}

})();
