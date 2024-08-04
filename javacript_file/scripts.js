document.addEventListener('DOMContentLoaded', async () => {
  	const loginForm = document.getElementById('login-form');

	if (loginForm) {
		loginForm.addEventListener('submit', async (event) => {
			event.preventDefault();
			let email = document.getElementById("email").value;
			let password = document.getElementById("password").value;
			await loginUser(email, password).catch(err => {
				if(err)
					alert("An error occured when trying to login");
			})
		});
	}
	checkAuthentication();

	if (window.location.pathname.indexOf('place.html') > -1) {
		const placeId = getPlaceIdFromUrl();
		if (!placeId) {
			alert('Place ID not found in URL');
			return;
		}
	
		try {
			await displayPlaceDetails(placeId);
			await displayAddReviewForm(placeId);
			document.getElementById('login-link').setAttribute('href', `login.html?redirect=place.html?id=${placeId}`);
		} catch (error) {
			console.error('Error fetching place details:', error);
			alert('Failed to fetch place details');
		}
	} else {
		const token = getCookie('token');
  		fetchPlaces(token);
		  document.getElementById('country-filter').addEventListener('change', (event) => {
			const selectedCountry = event.target.value;
			const placeElements = document.getElementById('places-list').children;
		
			Array.from(placeElements).forEach(placeElement => {
			  if (placeElement.textContent.includes(`${selectedCountry}`) || selectedCountry === 'all') {
				placeElement.style.display = 'block';
			  } else {
				placeElement.style.display = 'none';
			  }
			});
		  });
	}
});

function isConnected() {
	return !!getCookie('token');
}

function getPlaceIdFromUrl() {
	const params = new URLSearchParams(window.location.search);
	return params.get('id');
}
  
function redirectFromUrl() {
	const params = new URLSearchParams(window.location.search);
	return params.get('redirect');
}
  
async function fetchPlaceDetails(placeId) {
	const response = await fetch(`http://localhost:5000/places/${placeId}`, {
		method: 'GET'
	});
	if (response.ok) {
		return await response.json();
	} else {
		throw new Error('Failed to fetch place details');
	}
}

async function displayPlaceDetails(placeId) {
	const place = await fetchPlaceDetails(placeId);
	const content = document.getElementById('place-info');
	const title = document.getElementById("place-title");

	title.innerHTML = place.description
	content.innerHTML = `
			<img src="${place.image_url == undefined ? 'images/place1.jpg' : place.image_url}" alt="${place.description}" class="place-image-large">
			<div class="place-info">
				<p><strong>Host:</strong> ${place.host_name}</p>
				<p><strong>Price per night:</strong> $${place.price_per_night}</p>
				<p><strong>Location:</strong> ${place.city_name}, ${place.country_name}</p>
			</div>
		`;
  
	const amenityIcons = [
		{ type:"WiFi", value:`<i class="fa fa-wifi" aria-hidden="true"></i>`},
		{ type:"Fireplace", value:`<i class="fa fa-free-code-camp" aria-hidden="true"></i>`},
		{ type:"Pool", value: `<i class='fas fa-swimming-pool'></i>`},
		{ type:"Beach Access", value:`<i class='fas fa-umbrella-beach'></i>`},
		{ type:"Gym", value:`<i class="fa fa-futbol-o" aria-hidden="true"></i>`},
		{ type:"Breakfast", value:`<i class="fa fa-coffee" aria-hidden="true"></i>`},
		{ type: "Air Conditioning", value:`<i class="bi bi-wind"></i>`}
	]

	const amenitiesList = document.getElementById('place-amenities');
	place.amenities.forEach(amenity => {
		const li = document.createElement('li');
		if(amenityIcons.find(x => x.type === amenity))
			li.innerHTML = amenityIcons.find(x => x.type === amenity).value
		else
			li.innerHTML = amenity;
		amenitiesList.appendChild(li);
	});
  
	const reviewsList = document.getElementById('reviews-list');
	reviewsList.innerHTML = '';
	place.reviews.forEach(review => {
		let stars = "";
		for(let i = 0; i < review.rating; i++)
			stars += `<i class="bi bi-star-fill"></i>`
		for(let i = 0; i < 5 - review.rating; i++)
			stars += `<i class="bi bi-star"></i>`
		const div = document.createElement('div');
		div.classList.add('review-card');
		div.innerHTML = `
			<p><strong>${review.user_name}:</strong></p>
			<br>
			<p>${review.comment}</p>
			<p>Rating: ${stars}</p>
		`;
		reviewsList.appendChild(div);
	});
}

async function displayAddReviewForm(placeId) {
	if (isConnected()) {
		document.getElementById('add-review-form').style.display = 'block';
		await addReview(placeId, () => displayPlaceDetails(placeId));
	} else {
		document.getElementById('add-review-form').style.display = 'none';
	}
}

async function addReview(placeId, callback) {
	const token = getCookie('token');
	const addReviewForm = document.getElementById('add-review-form');
		addReviewForm.addEventListener('submit', async (event) => {
		  event.preventDefault();
  
		  const rating = document.getElementById('rating').value;
		  const review = document.getElementById('review').value;
  
		  fetch(`http://localhost:5000/places/${placeId}/reviews`,{
			  method: 'POST',
			  headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			  },
			  body: JSON.stringify({
				rating: rating,
				review: review
			  })
			})
			.then(() => {
			  alert('Review submitted successfully!');
			  callback();
			})
			.catch(error => console.error('Failed to submit review:', error));
		  });
}


async function loginUser(email, password) {
  const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
  });
  if (response.ok) {
    const data = await response.json();
    document.cookie = `token=${data.access_token}; path=/`;
    window.location.href = redirectFromUrl() || 'index.html';
  } else {
      alert('Unable to login ' + response.statusText);
  }
}

function checkAuthentication() {
	const token = getCookie('token');
  	const loginLink = document.getElementById('login-link');

	if (!token) {
		loginLink.style.display = 'block';
	} else {
		loginLink.style.display = 'none';
	}
}

function getCookie(name) {
  let cookies = document.cookie;
  if(cookies) {
    let cookieData = cookies.split(";");
    for(let i = 0; i < cookieData.length; i++) {
      let cookie = cookieData[i];
      let key = cookie.split("=")[0];
      let value = cookie.split("=")[1];
      if(key === name)
        return value;
    }
  }
  return;
}

async function fetchPlaces(token, countryToDisplay = "all") {
  const response = await fetch('http://localhost:5000/places', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': token
    }
  });
  if (response.ok) {
		const places = await response.json();
		displayPlaces(places, countryToDisplay);

		let countries = [];
		for(let i = 0; i < places.length; i++) {
			let country = places[i];
			if(!countries.find(x => x.id === country.country_code))
				countries.push({"id":country.country_code, "name":country.country_name})
		}

		const countryFilter = document.getElementById('country-filter');
		countryFilter.innerHTML = "";
		
		const allOption = document.createElement('option');
		allOption.value = "all";
		allOption.textContent = "All";
		if(countryToDisplay === "all")
			allOption.setAttribute("selected", "selected")
		countryFilter.appendChild(allOption);

		countries.forEach(country => {
			const option = document.createElement('option');
			option.value = country.id;
			option.textContent = country.name;
			if(countryToDisplay === country.id)
				option.setAttribute("selected", "selected")
			countryFilter.appendChild(option);
		});
		document.getElementById('country-filter').addEventListener('change', (event) => {
			filterPlaces(event.target.value);
		});
    } else {
    	alert('An error occured while trying to fetch places');
    }
}

function filterPlaces(selectedCountry) {
	fetchPlaces(getCookie("token"), selectedCountry)
}

function displayPlaces(places, countries = "all") {
    const placesList = document.getElementById('places-list');
	const maxElementPerRow = 3;

	placesList.innerHTML = "";
	let listHTML = "";
	let actualElement = 0;
	for(let i = 0; i < places.length; i++) {
		let place = places[i];

		if(countries === "all" || place.country_code === countries) {
			if(actualElement === 0)
			listHTML += `<ul class="row">`
			listHTML += `<li class="place-card" data-country="${place.country_code}">
                    <div>
                    <img src="" alt="Place Image" class="place-image">
                    <div class="place-info">
                        <h2>${place.description}</h2>
                        <p class="price">Price per night: <strong>$${place.price_per_night}</strong></p>
                        <p class="location">Location: <strong>${place.city_name}, ${place.country_name}</strong></p>
                        <a class="details-button" href="place.html?id=${place.id}">View Details</a>
                    </div>
                    </div>
                </li>`
		
			actualElement++;
			if(actualElement === maxElementPerRow) {
				listHTML += `</ul>`;
				actualElement = 0;
			}
		}
	}
	placesList.innerHTML = listHTML;
}
