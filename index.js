// I want to get the reddit link from the form, shorten it and then submit the form with that shortened link, to shorten the urls for results.html
// but I also want the original link to remain intact if the user returns to the form with the back button
// So I have the full link in a form element without a name, so it won't be submitted with the form. So it is accessed with type=url.
// And I have a hidden element which will take the shortened link.
// I'm not sure that this all is worth it because it makes the app less adaptable to a change in reddit urls
// However, it is better for security as it ensures that the only links accessed by the app will be https://reddit.com/r/peloton/comments/...
// If the whole link is provided in the query parameters, then someone could provide a link with ?...reddit=dodgysite.com and the request would be made by the app
// This is one way of limiting requests made to specific areas while also reducing the url length, so I think it's a good way of doing it
// I could also do it with a copy of the form, and this would avoid having to select based on input type

function handleForm(event) {
	const form = event.target;
	const link = form.querySelector('input[type=url]').value;
	// const suffix = link.split(/reddit\.com\/r\/peloton\/comments\//i)[1].replace(/\/+$/, '');
	const suffix = link.match(/reddit\.com\/r\/peloton\/comments\/(.+?)(?:\/+)?$/)[1]; // Better way to get group than index?
	if (suffix) {
		form.elements.r.value = suffix;
	} else {
		// error
	}

	// 	// form.submit();

	// 	// the below works until the submit() which does nothing... ?
	//  // it will work if copyForm is added to the DOM before submitting
	// 	// const copyForm = form.cloneNode(true);
	// 	// copyForm.elements.r.value = link;
	// 	// copyForm.removeAttribute('onsubmit');
	// 	// console.log(copyForm);
	// 	// copyForm.submit();

	// event.preventDefault();
}
