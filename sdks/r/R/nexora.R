#' Connect to Nexora Server
#' @param host Character, default '127.0.0.1'
#' @param port Integer, default 6380
#' @export
nexora_connect <- function(host = "127.0.0.1", port = 6380) {
  con <- socketConnection(host = host, port = port, open = "r+b", blocking = TRUE)
  structure(list(con = con), class = "nexora_client")
}

#' Close Nexora connection
#' @param client nexora_client object
#' @export
nexora_close <- function(client) {
  close(client$con)
}
