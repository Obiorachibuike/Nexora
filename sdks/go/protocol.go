package nexora

import (
	"encoding/binary"
	"errors"
)

var (
	MagicBytes      = []byte("NEXO")
	ProtocolVersion = byte(1)
	HeaderLen       = 24
)

const (
	MsgRequest  = 1
	MsgResponse = 2
	MsgPing     = 3
	MsgPong     = 4
)

const (
	CmdAuth     = 0x0001
	CmdPing     = 0x0002
	CmdInfo     = 0x0003
	CmdSet      = 0x0010
	CmdGet      = 0x0011
	CmdDel      = 0x0012
	CmdExists   = 0x0013
	CmdExpire   = 0x0014
	CmdTtl      = 0x0015
	CmdSetNx    = 0x0016
	CmdCas      = 0x0017
	CmdIncr     = 0x0018
	CmdKeys     = 0x001A
	CmdQueueAdd = 0x0020
	CmdQueueFetch = 0x0021
	CmdQueueAck = 0x0022
	CmdQueueFail = 0x0023
	CmdQueueInspect = 0x0024
)

const (
	StatusOk           = 0x0000
	StatusCreated      = 0x0001
	StatusNotFound     = 0x0002
	StatusUnauthorized = 0x0003
	StatusBadRequest   = 0x0004
	StatusConflict     = 0x0005
	StatusServerError  = 0x0006
	StatusLeaseExpired = 0x0007
)

func CRC16(data []byte) uint16 {
	var crc uint16 = 0xFFFF
	for _, b := range data {
		crc ^= uint16(b) << 8
		for i := 0; i < 8; i++ {
			if crc&0x8000 != 0 {
				crc = (crc << 1) ^ 0x1021
			} else {
				crc = crc << 1
			}
		}
	}
	return crc
}

func EncodeFrame(msgType byte, cmdOrStatus uint16, correlationID uint64, payload []byte) []byte {
	payloadLen := uint32(len(payload))
	buf := make([]byte, HeaderLen+len(payload))

	copy(buf[0:4], MagicBytes)
	buf[4] = ProtocolVersion
	buf[5] = msgType
	binary.BigEndian.PutUint16(buf[6:8], 0) // flags
	binary.BigEndian.PutUint64(buf[8:16], correlationID)
	binary.BigEndian.PutUint16(buf[16:18], cmdOrStatus)
	binary.BigEndian.PutUint32(buf[18:22], payloadLen)

	checksum := CRC16(buf[0:22])
	binary.BigEndian.PutUint16(buf[22:24], checksum)

	if len(payload) > 0 {
		copy(buf[HeaderLen:], payload)
	}

	return buf
}

func DecodeHeader(buf []byte) (correlationID uint64, status uint16, payloadLen uint32, err error) {
	if len(buf) < HeaderLen {
		return 0, 0, 0, errors.New("buffer too short")
	}
	if string(buf[0:4]) != "NEXO" {
		return 0, 0, 0, errors.New("invalid magic bytes")
	}
	checksum := binary.BigEndian.Uint16(buf[22:24])
	if CRC16(buf[0:22]) != checksum {
		return 0, 0, 0, errors.New("header checksum mismatch")
	}
	correlationID = binary.BigEndian.Uint64(buf[8:16])
	status = binary.BigEndian.Uint16(buf[16:18])
	payloadLen = binary.BigEndian.Uint32(buf[18:22])
	return correlationID, status, payloadLen, nil
}
