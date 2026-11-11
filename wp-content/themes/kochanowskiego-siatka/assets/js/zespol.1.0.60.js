/* „Nasz zespół”: filtry (przychodnia i specjalizacja jako pigułki = radio, nazwisko) i opisy zwinięte do 3 linijek. */
(function () {
	'use strict';

	var form = document.querySelector('.sg-zespol__filtr');
	var osoby = Array.prototype.slice.call(document.querySelectorAll('.sg-osoba'));
	if (!form || !osoby.length) return;

	var grupy = Array.prototype.slice.call(document.querySelectorAll('.sg-zespol__grupa'));
	var wynik = form.querySelector('.sg-zespol__wynik');
	var brak = document.querySelector('.sg-zespol__brak');
	var pola = {
		przychodnia: form.elements.przychodnia,
		specjalizacja: form.elements.specjalizacja,
		szukaj: form.elements.szukaj
	};

	function bezOgonkow(s) {
		return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
	}

	function osob(n) {
		if (n === 1) return 'osoba';
		var d = n % 10, s = n % 100;
		return (d >= 2 && d <= 4 && (s < 12 || s > 14)) ? 'osoby' : 'osób';
	}

	function filtruj(zapiszAdres) {
		var p = pola.przychodnia.value;
		var sp = pola.specjalizacja.value;
		var q = bezOgonkow(pola.szukaj.value.trim());
		var widoczne = 0;

		osoby.forEach(function (o) {
			var ok = true;
			if (p) ok = (' ' + (o.dataset.przychodnia || '') + ' ').indexOf(' ' + p + ' ') !== -1;
			if (ok && sp) {
				ok = sp.indexOf('grupa:') === 0
					? o.dataset.grupa === sp.slice(6)
					: (' ' + (o.dataset.specjalizacje || '') + ' ').indexOf(' ' + sp + ' ') !== -1;
			}
			if (ok && q) ok = bezOgonkow(o.dataset.nazwisko).indexOf(q) !== -1;
			o.hidden = !ok;
			if (ok) widoczne++;
		});
		grupy.forEach(function (g) {
			g.hidden = !g.querySelector('.sg-osoba:not([hidden])');
		});

		var aktywne = p || sp || q;
		wynik.textContent = aktywne ? 'Znaleziono: ' + widoczne + ' ' + osob(widoczne) + '.' : '';
		brak.hidden = widoczne !== 0;
		form.querySelector('.sg-zespol__wyczysc').hidden = !aktywne;

		if (zapiszAdres && window.history && history.replaceState) {
			var u = new URL(location.href);
			['przychodnia', 'specjalizacja', 'szukaj'].forEach(function (k) {
				if (pola[k].value.trim()) u.searchParams.set(k, pola[k].value.trim()); else u.searchParams.delete(k);
			});
			history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
		}
		mierzOpisy();
	}

	// Stan z adresu (?przychodnia=kondratowicza&specjalizacja=onkologia) — link do konkretnej listy.
	var start = new URLSearchParams(location.search);
	['przychodnia', 'specjalizacja', 'szukaj'].forEach(function (k) {
		if (start.get(k)) pola[k].value = start.get(k);
	});

	form.hidden = false;

	// Telefon: opcje są przewijanymi rzędami — pokaż wybraną (np. z linku), bez przewijania strony.
	Array.prototype.forEach.call(form.querySelectorAll('.sg-zespol__opcje input:checked'), function (wybrana) {
		var rzad = wybrana.closest('.sg-zespol__opcje');
		if (rzad.scrollWidth <= rzad.clientWidth) return;
		var p = wybrana.closest('.sg-pigulka');
		rzad.scrollLeft += p.getBoundingClientRect().left - rzad.getBoundingClientRect().left - 16;
	});

	form.addEventListener('input', function () { filtruj(true); });
	form.addEventListener('change', function () { filtruj(true); });
	form.addEventListener('submit', function (e) { e.preventDefault(); });
	form.addEventListener('reset', function () { setTimeout(function () { filtruj(true); }, 0); });
	brak.querySelector('button').addEventListener('click', function () { form.reset(); pola.szukaj.focus(); });

	// Opisy: 3 linijki + „Zobacz więcej” (tylko gdy tekst jest dłuższy; treść cały czas jest w HTML).
	var opisy = Array.prototype.slice.call(document.querySelectorAll('.sg-osoba__opis'));
	opisy.forEach(function (op) {
		var b = document.createElement('button');
		b.type = 'button';
		b.className = 'sg-osoba__wiecej';
		b.setAttribute('aria-expanded', 'false');
		b.setAttribute('aria-controls', op.id);
		b.textContent = 'Zobacz więcej';
		b.hidden = true;
		op.after(b);
		op.classList.add('is-zwiniety');
		b.addEventListener('click', function () {
			var rozwin = b.getAttribute('aria-expanded') !== 'true';
			op.classList.toggle('is-zwiniety', !rozwin);
			b.setAttribute('aria-expanded', String(rozwin));
			b.textContent = rozwin ? 'Zwiń' : 'Zobacz więcej';
			if (!rozwin) op.closest('.sg-osoba').scrollIntoView({ block: 'nearest' });
		});
	});

	function mierzOpisy() {
		opisy.forEach(function (op) {
			var b = op.nextElementSibling;
			if (!b || op.closest('[hidden]')) return;
			if (b.getAttribute('aria-expanded') === 'true') { b.hidden = false; return; }
			b.hidden = op.scrollHeight <= op.clientHeight + 2;
		});
	}

	filtruj(false);
	window.addEventListener('resize', function () { clearTimeout(mierzOpisy.t); mierzOpisy.t = setTimeout(mierzOpisy, 150); });
	if (document.fonts && document.fonts.ready) document.fonts.ready.then(mierzOpisy);
})();
