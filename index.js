// Problem: changing the actual values means that the values stick after confirming and going back
// would be better to make another form or smth

// What to do with situation where some are filled in and some not?
// Could just display a message
// Or could have a function onchange of all the input fields, if any one is non-empty, then all are required.
// else none are required.

// Clear all input fields
function clearAll(event) {
	for (const e of event.target.form.elements) {
		if (['text', 'url'].includes(e.type)) {
			e.value = '';
		}
	}
	inputChange(event);
}

// On change of any element of the form: if all fields are empty, set none to required.
// Otherwise, set all to required.
function inputChange(event) {
	console.log('form on change');
	console.log(event);
	const elements = Array.from(event.target.form.elements).filter(element => ['text', 'url'].includes(element.type));
	if (elements.every(e => !e.value)) {
		elements.forEach(e => e.removeAttribute('required'));
	} else {
		elements.forEach(e => e.setAttribute('required', 'true'));
	}
}

// function test(event) {
// 	console.log('copy form submit');
// 	event.preventDefault();
// 	return false;
// }

function handleForm(event) {
	const form = event.target;
	console.log(form.elements);

	const elements = Array.from(form.elements).filter(element => ['text', 'url'].includes(element.type));
	console.log(elements);
	if (elements.every(element => !element.value)) { // all fields empty
		// elements.forEach(element => element.value = element.placeholder);

		// let copyForm = document.forms.copyform;
		const copyForm = form.cloneNode(true);
		copyForm.setAttribute('hidden', 'true');
		// copyForm.onsubmit = test;
		// copyForm.action = '';
		copyForm.name = 'copyform';
		for (const e of copyForm.elements) {
			e.value = e.placeholder;
		}
		console.log(copyForm);
		document.body.appendChild(copyForm); // this is necessary for submit() to work
		copyForm.submit(); // submit() skips the onsubmit function, and validation. requestSubmit() calls it.
		// copyForm.requestSubmit();
		document.body.removeChild(copyForm);
		event.preventDefault();
	} else if (elements.every(element => element.value)) {
		// submit form
	} else { // some empty, some non-empty elements. not acceptable.
		// for (const element of elements.filter(e => !e.value)) {
		// 	element.setAttribute('required', 'true');
		// }
		// this should not occur as the use of inputChange() should prevent submission with this case
		// however, apparently it is not guaranteed that onchange events will trigger before submit events
		// so I need something proper here
		// could use oninput instead but it gets called a lot
		alert('error');
		event.preventDefault();
	}
	console.log(elements);
}