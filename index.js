const invalidLinkMessage = 'Link must be one of the following formats: https://redd.it/..., https://www.reddit.com/comments/..., https://www.reddit.com/r/.../comments/...';
// how to get newline in message?

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
// If a form is submitted with some but not all elements set, all will be set to required
// So that the form can be submitted with either all empty elements, which will use default, or all set elements
function inputChange(event) {
	console.log('inputChange');
	const form = event.target.form;
	// If all elements are empty, remove required status, if it was previously set by an erroneous submit
	const elements = Array.from(form.elements).filter(element => ['text', 'url'].includes(element.type));
	if (elements.every(e => !e.value)) {
		elements.forEach(e => e.removeAttribute('required'));
	} /*else {
		elements.forEach(e => e.setAttribute('required', 'true'));
	}*/
	// Set or remove validity message for invalid link value
	if ((!form.elements.r.value) || shortenLink(form.elements.r.value)) {
		form.elements.r.setCustomValidity('');
	} else {
		form.elements.r.setCustomValidity(invalidLinkMessage);
	}
}

function cloneForm(form) {
	return form.cloneNode(true);
}

function submitCloneForm(form) {
	form.setAttribute('hidden', 'true');
	form.name = 'copyform';
	document.body.appendChild(form); // this is necessary for submit() to work
	form.submit(); // submit() skips the onsubmit function, and validation. requestSubmit() calls it.
	document.body.removeChild(form);
}

// 1. If all form elements are set, keep as is. If no elements are set, use default values. Otherwise, error
// 2. Shorten reddit link
// 3. Submit
function handleForm(event) {
	console.log('handleform');
	event.preventDefault();
	const form = event.target;
	// use a separate form so that the changed values don't stick when the page is returned to with the back button
	// for the link shortening, could use an extra hidden form field instead, but this keeps things more uniform
	const copyForm = cloneForm(form);
	// copyForm.action = 'results.html'; // remove action from actual form so that event.preventDefault() isn't necessary

	const elements = Array.from(form.elements).filter(element => ['text', 'url'].includes(element.type));
	if (elements.every(element => !element.value)) { // all fields empty
		for (const e of copyForm.elements) {
			e.value = e.placeholder;
		}
	} else if (!elements.every(element => element.value)) { // some empty, some non-empty elements. not acceptable.
		for (const e of elements) {
			e.setAttribute('required', 'true');
		}
		form.reportValidity();
		// onchange and oninput won't necessarily be called before form submission
		return;
	}

	const shortLink = shortenLink(copyForm.elements.r.value);
	if (shortLink) {
		copyForm.elements.r.value = shortLink;
		submitCloneForm(copyForm);
	} else {
		form.elements.r.setCustomValidity(invalidLinkMessage);
		form.reportValidity();
		// though the validity message is set in onchange, that won't necessarily be called before submit, eg if user sets value, then refreshes and submits without changing value again
		// Validity messages need to be removed with an oninput/change handler before the onsubmit function will be called again
	}
}

// I want to get the reddit link from the form, shorten it and then submit the form with that shortened link, to shorten the urls for results.html
// but I also want the original link to remain intact if the user returns to the form with the back button
// This shortening makes the app less adaptable to a change in reddit urls, but it also is more secure as it limits the sites that the app will access to reddit.com
// If the whole link is provided in the query parameters, then someone could provide a link with ?...reddit=dodgysite.com and the request would be made by the app
// Instead of copyform, I could have the full link in a form element without a name, so it won't be submitted with the form. So it is accessed with type=url.
// And I'd have a hidden element which will take the shortened link.
function shortenLink(link) {
	// Options for link formats: https://redd.it/izsgs1, https://www.reddit.com/comments/izsgs1, https://www.reddit.com/r/peloton/comments/izsgs1, https://www.reddit.com/r/peloton/comments/izsgs1/rfl_20_wc_rr_15_days_left_until_the_deadline_on/
	// .json doesn't work on the first, which just serves a redirect, but does work on the others
	// I want to extract the 'izsgs1' from these links

	const match = link.match(/(?:reddit\.com\/(?:r\/.+\/)?comments|redd\.it)\/(.*?)(?:\/|$)/);
	return (match && match[1]) || null;
}
