const storeInSession = (key, value) => {
	return sessionStorage.setItem(key, value);
}

const lookInSession = (key) => {
	return sessionStorage.setItem(key)
}

const removeFromSession = (key) => {
  return sessionStorage.removeItem(key)
}

const logOutUser = () => {
	sessionStorage.clear();
};

export { storeInSession, lookInSession, removeFromSession, logOutUser };