function ErrorMessage({ message = "Something went wrong." }) {
  return (
    <div className="error-message">
      <h3>Unable to complete request</h3>

      <p>{message}</p>
    </div>
  );
}

export default ErrorMessage;
