from app.core.profile_links import clean_social_profile_url


def test_provider_home_pages_are_not_profile_links():
    assert clean_social_profile_url("https://github.com", "github") is None
    assert clean_social_profile_url("github.com/", "github") is None
    assert clean_social_profile_url("https://linkedin.com", "linkedin") is None
    assert clean_social_profile_url("https://www.linkedin.com/", "linkedin") is None


def test_real_profile_links_are_preserved():
    assert clean_social_profile_url("https://github.com/pranay", "github") == "https://github.com/pranay"
    assert clean_social_profile_url("linkedin.com/in/pranay", "linkedin") == "linkedin.com/in/pranay"
