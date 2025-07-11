function status(request, response) {
  response.status(200).json({ chave: "são pessoas a cima da média" });
}

export default status;
