export async function getAuthToken({ code }) {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } =
    import.meta.env;
  const formData = new FormData();
  formData.append("grant_type", "authorization_code");
  formData.append("code", code);
  formData.append("redirect_uri", SPOTIFY_REDIRECT_URI);

  const encodedData = new URLSearchParams(formData).toString();

  const spotifyTokenUrl = `https://accounts.spotify.com/api/token`;
  const authCode = new Buffer.from(
    SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET
  ).toString("base64");
  const spotifyResponse = await fetch(spotifyTokenUrl, {
    headers: {
      Authorization: `Basic ${authCode}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    body: encodedData,
  }).then((response) => response.json());

  return spotifyResponse.access_token;
}

async function fetchFromSpotify({ endpoint, queryParams, authToken }) {
  const fullSpotifyUrl = new URL(`https://api.spotify.com/v1/${endpoint}`);

  if (queryParams) {
    const queryKeys = Object.keys(queryParams);
    for (const key of queryKeys) {
      fullSpotifyUrl.queryParams.set(key, queryParams[key]);
    }
  }

  const spotifyResponse = await fetch(fullSpotifyUrl.toString(), {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!spotifyResponse.ok) {
    const responseText = await spotifyResponse.text();
    throw new Error(responseText);
  }

  const spotifyData = await spotifyResponse.json();

  return spotifyData;
}

export async function getCurrentUserProfile(authToken) {
  // TODO: maybe we should save that somewhere? cache it?
  const userProfile = await fetchFromSpotify({
    endpoint: "me",
    authToken,
  });

  return userProfile;
}

export async function getTopArtists(authToken) {
  const topArtistsData = await fetchFromSpotify({
    endpoint: "me/top/artists",
    queryParams: {
      limit: 50,
      time_range: "long_term",
    },
    authToken,
  });
}
