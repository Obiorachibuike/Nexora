defmodule Nexora do
  @moduledoc """
  Official Elixir SDK for the Nexora independent infrastructure engine.
  """

  def connect(host \\ '127.0.0.1', port \\ 6380) do
    :gen_tcp.connect(host, port, [:binary, active: false])
  end

  def ping(socket) do
    # Frame for ping
    header = <<"NEXO", 1::8, 1::8, 0::16, 1::64, 0x0002::16, 0::32, 0::16>>
    :gen_tcp.send(socket, header)
    case :gen_tcp.recv(socket, 24) do
      {:ok, _header} -> {:ok, :pong}
      {:error, reason} -> {:error, reason}
    end
  end
end
