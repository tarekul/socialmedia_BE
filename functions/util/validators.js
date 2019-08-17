const isEmail = email => {
  const reqEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(email.match(reqEx)) return true
  else return false
}

const isEmpty = string =>{
  if(string.trim() === '') return true;
  else return false;
}

exports.validateSignupData = data =>{
  const {email,password,confirmPassword,handle} = data
  let errors = {};
  if(isEmpty(email)) errors.email = 'Email must not be empty'
  else if(!isEmail(email)) errors.email = 'Must be a valid email address'
  
  if(isEmpty(password)) errors.password = 'Must not be empty'
  if(password !== confirmPassword) errors.confirmPassword = 'Passwords must match'
  if(isEmpty(handle)) errors.handle = 'Must not be empty'

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  }
}

exports.validateLoginData = data =>{
  const {email,password} = data
  let errors = {}
  if(isEmpty(email)) errors.email = 'Must not be empty';
  if(isEmpty(password)) errors.password = 'Must not be empty';

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  }
}