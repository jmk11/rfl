// I want to get the reddit link from the form, shorten it and then submit the form with that shortened link, to shorten the urls for results.html
// but I also want the original link to remain intact if the user returns to the form with the back button
// So I have the full link in a form element without a name, so it won't be submitted with the form. So it is accessed with type=url.
// And I have a hidden element which will take the shortened link.
// I could also do it with a copy of the form, and this would avoid having to select based on input type
// This shortening makes the app less adaptable to a change in reddit urls, but it also is more secure as it limits the sites that the app will access to reddit.com
// If the whole link is provided in the query parameters, then someone could provide a link with ?...reddit=dodgysite.com and the request would be made by the app

function handleForm(event) {
	const form = event.target;
	const link = form.querySelector('input[type=url]').value;
	// Options for link formats: https://redd.it/izsgs1, https://www.reddit.com/comments/izsgs1, https://www.reddit.com/r/peloton/comments/izsgs1, https://www.reddit.com/r/peloton/comments/izsgs1/rfl_20_wc_rr_15_days_left_until_the_deadline_on/
	// .json doesn't work on the first, which just serves a redirect, but does work on the others

	// const suffix = link.split(/reddit\.com\/r\/peloton\/comments\//i)[1].replace(/\/+$/, '');
	// const suffix = link.match(/reddit\.com\/r\/peloton\/comments\/(.+?)(?:\/+)?$/)[1]; // Better way to get group than index?
	// const linkid = link.match(/reddit\.com\/r\/peloton\/comments\/(.+?)\//)[1];
	try {
		const linkid = link.match(/(?:reddit\.com\/(?:r\/peloton\/)?comments|redd\.it)\/(.*?)(?:\/|$)/)[1];
		if (linkid) {
			form.elements.r.value = linkid;
		} else {
			throw Error;
		}
	} catch {
		alert('Link error'); // todo
		event.preventDefault();
	}

	// const copyForm = form.cloneNode(true);
	// copyForm.elements.r.value = link;
	// console.log(copyForm);
	// document.body.appendChild(copyForm);
	// copyForm.submit();
	// document.body.removeChild(copyForm);
	// event.preventDefault();
}
