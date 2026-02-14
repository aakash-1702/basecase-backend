class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    (this.statusCode = statusCode),
      (this.data = data),
      (this.message = message),
      (this.success = statusCode < 400); // anything below 400 would be good to go
  }
}

export default ApiResponse ;