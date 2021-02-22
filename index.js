// Clear all input fields, quality of life
function clearAll(event) {
	for (const e of event.target.form.elements) {
		if (['text', 'url'].includes(e.type)) {
			e.value = '';
		}
	}
	inputChange(event);
}

// On change of any element of the form: if all fields are empty, set none to required.
// Otherwise, set all to required
// So that the form can be submitted with either all empty elements, which will use default, or all set elements
// Possibly should change to validate the form and manually set required messages/visuals on submission
function inputChange(event) {
	const elements = Array.from(event.target.form.elements).filter(element => ['text', 'url'].includes(element.type));
	if (elements.every(e => !e.value)) {
		elements.forEach(e => e.removeAttribute('required'));
	} else {
		elements.forEach(e => e.setAttribute('required', 'true'));
	}
}

function cloneForm(form) {
	const copyForm = form.cloneNode(true);
	copyForm.setAttribute('hidden', 'true');
	copyForm.name = 'copyform';
	document.body.appendChild(copyForm); // this is necessary for submit() to work
	return copyForm;
}

function submitCloneForm(form) {
	form.submit(); // submit() skips the onsubmit function, and validation. requestSubmit() calls it.
	// copyForm.requestSubmit();
	document.body.removeChild(form);
}

// 1. If all form elements are set, keep as is. If no elements are set, use default values. Otherwise, error
// 2. Shorten reddit link
// 3. Submit
function handleForm(event) {
	const form = event.target;
	// use a separate form so that the changed values don't stick when the page is returned to with the back button
	// for the link shortening, could use an extra hidden form field instead, but this keeps things more uniform
	const copyForm = cloneForm(form);
	// copyForm.action = 'results.html'; // remove action from actual form so that event.preventDefault() isn't necessary

	const elements = Array.from(form.elements).filter(element => ['text', 'url'].includes(element.type));
	if (elements.every(element => !element.value)) { // all fields empty
		console.log('fields empty: ', copyForm);
		for (const e of copyForm.elements) {
			e.value = e.placeholder;
		}
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
		// todo
		alert('error');
		event.preventDefault();
		throw Error;
	}

	const shortLink = shortenLink(copyForm.elements.r.value);
	if (shortLink) {
		copyForm.elements.r.value = shortLink;
		submitCloneForm(copyForm);
	} else {
		alert('error');
		// todo
	}
	event.preventDefault();
}

// I want to get the reddit link from the form, shorten it and then submit the form with that shortened link, to shorten the urls for results.html
// but I also want the original link to remain intact if the user returns to the form with the back button
// This shortening makes the app less adaptable to a change in reddit urls, but it also is more secure as it limits the sites that the app will access to reddit.com
// If the whole link is provided in the query parameters, then someone could provide a link with ?...reddit=dodgysite.com and the request would be made by the app
// Instead of copyform, I coulld have the full link in a form element without a name, so it won't be submitted with the form. So it is accessed with type=url.
// And I have a hidden element which will take the shortened link.
function shortenLink(link) {
	// Options for link formats: https://redd.it/izsgs1, https://www.reddit.com/comments/izsgs1, https://www.reddit.com/r/peloton/comments/izsgs1, https://www.reddit.com/r/peloton/comments/izsgs1/rfl_20_wc_rr_15_days_left_until_the_deadline_on/
	// .json doesn't work on the first, which just serves a redirect, but does work on the others

	// const suffix = link.split(/reddit\.com\/r\/peloton\/comments\//i)[1].replace(/\/+$/, '');
	// const suffix = link.match(/reddit\.com\/r\/peloton\/comments\/(.+?)(?:\/+)?$/)[1]; // Better way to get group than index?
	// const linkid = link.match(/reddit\.com\/r\/peloton\/comments\/(.+?)\//)[1];
	try {
		// const match = ...
		// const linkid = (match && match[1]) || null;
		const linkid = link.match(/(?:reddit\.com\/(?:r\/peloton\/)?comments|redd\.it)\/(.*?)(?:\/|$)/)[1];
		return linkid;
	} catch {
		return null;
	}
}
