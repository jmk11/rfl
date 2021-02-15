// I want to get the reddit link from the form, shorten it and then submit the form with that shortened link, to shorten the urls for results.html
// but I also want the original link to remain intact if the user returns to the form with the back button
// So I have the full link in a form element without a name, so it won't be submitted with the form. So it is accessed with type=url.
// And I have a hidden element which will take the shortened link.
// I'm not sure that this all is worth it because it makes the app less adaptable to a change in reddit urls

function handleForm(event) {
	const form = event.target;
	const link = form.querySelector('input[type=url]').value;
	const suffix = link.split(/reddit\.com\/r\/peloton\/comments\//i)[1].replace(/\/+$/, '');
	if (suffix) {
		form.elements.r.value = suffix;
	} else {
		// error
	}

	// 	// form.submit();

	// 	// the below works until the submit() which does nothing... ?
	// 	// const copyForm = form.cloneNode(true);
	// 	// copyForm.elements.r.value = link;
	// 	// copyForm.removeAttribute('onsubmit');
	// 	// console.log(copyForm);
	// 	// copyForm.submit();

	// event.preventDefault();
}
