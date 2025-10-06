export const handleError = (err) => {
  console.error(err);
  alert(err.message || "Something went wrong!");
};
