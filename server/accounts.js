ServiceConfiguration.configurations.remove({
    service: "instagram"
  });
  ServiceConfiguration.configurations.insert({
    service: "instagram",
    clientId: "362593ba92794e5fad861f2db42fc8db",
    scope:'basic',
    secret: "1902fd74d56d424f8e32b331aeecb63f"
  });
/*
  //code: 14c3c1cd59c141c99d7d064ba22e9e1f
  curl -F 'client_id='362593ba92794e5fad861f2db42fc8db' \
    -F 'client_secret=1902fd74d56d424f8e32b331aeecb63f' \
    -F 'grant_type=authorization_code' \
    -F 'redirect_uri=http://localhost:3000/_oauth/instagram' \
    -F 'code=14c3c1cd59c141c99d7d064ba22e9e1f' \
    https://api.instagram.com/oauth/access_token

    curl -F 'client_id=CLIENT_ID' \
    -F 'client_secret=CLIENT_SECRET' \
    -F 'grant_type=authorization_code' \
    -F 'redirect_uri=AUTHORIZATION_REDIRECT_URI' \
    -F 'code=CODE' \
    https://api.instagram.com/oauth/access_token


    https://instagram.com/oauth/authorize/?client_id=362593ba92794e5fad861f2db42fc8db&redirect_uri=http://localhost:3000&response_type=token
    token: 267464263.362593b.a1f18dbefa4443509da2049f12543be9
    */