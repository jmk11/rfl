function handleForm(event) {
	console.log(event.target.elements.reddit.value);
	const link = event.target.elements.reddit.value.split(/reddit\.com\/r\/peloton\/comments\//i)[1].replace(/\/+$/, '');
	if (link) {
		console.log(link);
		

	} else {
		// error
	}
	event.preventDefault();
}
