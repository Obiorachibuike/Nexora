package = "nexora"
version = "scm-1"
source = {
   url = "git://github.com/Obiorachibuike/Nexora.git"
}
description = {
   summary = "Official Lua SDK for the Nexora infrastructure engine.",
   license = "MIT"
}
dependencies = {
   "lua >= 5.1",
   "luasocket"
}
build = {
   type = "builtin",
   modules = {
      nexora = "nexora.lua"
   }
}
