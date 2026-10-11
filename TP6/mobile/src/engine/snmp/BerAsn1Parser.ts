/**
 * BER (Basic Encoding Rules) & ASN.1 Parser y Serializador para SNMP v1/v2c (RFC 1157 / RFC 1905)
 * Implementado en TypeScript puro sin dependencias nativas externas.
 */

export const ASN1_TAGS = {
  INTEGER: 0x02,
  OCTET_STRING: 0x04,
  NULL: 0x05,
  OBJECT_IDENTIFIER: 0x06,
  SEQUENCE: 0x30,
  // SNMP Application types
  IP_ADDRESS: 0x40,
  COUNTER32: 0x41,
  GAUGE32: 0x42,
  TIMETICKS: 0x43,
  // SNMP PDUs (Context-specific constructed)
  GET_REQUEST: 0xa0,
  GET_NEXT_REQUEST: 0xa1,
  GET_RESPONSE: 0xa2,
  SET_REQUEST: 0xa3,
};

export interface SnmpVarBind {
  oid: string;
  type: string;
  value: any;
  rawBytes?: Uint8Array;
}

export interface SnmpPacket {
  version: number; // 0 = SNMPv1, 1 = SNMPv2c
  community: string;
  pduType: number;
  requestId: number;
  errorStatus: number;
  errorIndex: number;
  varbinds: SnmpVarBind[];
}

export class BerAsn1Parser {
  /**
   * Construye un paquete binario SNMP GetRequest PDU
   */
  static buildGetRequest(
    oid: string,
    community: string = 'public',
    requestId: number = 1001,
    version: number = 1 // 1 = v2c
  ): Uint8Array {
    // 1. Codificar VarBind: SEQUENCE { oid, NULL }
    const encodedOid = this.encodeOid(oid);
    const encodedNull = new Uint8Array([ASN1_TAGS.NULL, 0x00]);
    const varBindContent = this.concatBuffers([encodedOid, encodedNull]);
    const varBind = this.encodeSequence(varBindContent);

    // 2. Codificar VarBindList: SEQUENCE { varBind }
    const varBindList = this.encodeSequence(varBind);

    // 3. Codificar Request ID, Error Status, Error Index
    const encRequestId = this.encodeInteger(requestId);
    const encErrorStatus = this.encodeInteger(0);
    const encErrorIndex = this.encodeInteger(0);

    // 4. Codificar PDU: [GetRequest] { reqId, errorStatus, errorIndex, varBindList }
    const pduContent = this.concatBuffers([
      encRequestId,
      encErrorStatus,
      encErrorIndex,
      varBindList,
    ]);
    const pdu = this.encodeTlv(ASN1_TAGS.GET_REQUEST, pduContent);

    // 5. Codificar Version y Community String
    const encVersion = this.encodeInteger(version);
    const encCommunity = this.encodeOctetString(community);

    // 6. Envolver todo en la SEQUENCE raíz
    const rootContent = this.concatBuffers([encVersion, encCommunity, pdu]);
    return this.encodeSequence(rootContent);
  }

  /**
   * Decodifica un paquete binario SNMP GetResponse PDU
   */
  static parseSnmpPacket(buffer: Uint8Array): SnmpPacket {
    let offset = 0;

    // Verificar cabecera SEQUENCE raíz
    if (buffer[offset] !== ASN1_TAGS.SEQUENCE) {
      throw new Error(`Tag inválido para SNMP packet: esperado 0x30, recibido 0x${buffer[offset].toString(16)}`);
    }
    offset++;

    const { length: rootLength, lengthBytes: rootLenBytes } = this.decodeLength(buffer, offset);
    offset += rootLenBytes;

    // 1. Version
    if (buffer[offset] !== ASN1_TAGS.INTEGER) {
      throw new Error('Version tag inválido');
    }
    const { value: version, nextOffset: afterVer } = this.decodeInteger(buffer, offset);
    offset = afterVer;

    // 2. Community
    if (buffer[offset] !== ASN1_TAGS.OCTET_STRING) {
      throw new Error('Community tag inválido');
    }
    const { value: community, nextOffset: afterComm } = this.decodeOctetString(buffer, offset);
    offset = afterComm;

    // 3. PDU Type
    const pduType = buffer[offset];
    offset++;
    const { length: pduLength, lengthBytes: pduLenBytes } = this.decodeLength(buffer, offset);
    offset += pduLenBytes;

    // 4. Request ID
    const { value: requestId, nextOffset: afterReqId } = this.decodeInteger(buffer, offset);
    offset = afterReqId;

    // 5. Error Status
    const { value: errorStatus, nextOffset: afterErrStat } = this.decodeInteger(buffer, offset);
    offset = afterErrStat;

    // 6. Error Index
    const { value: errorIndex, nextOffset: afterErrIdx } = this.decodeInteger(buffer, offset);
    offset = afterErrIdx;

    // 7. VarBindList SEQUENCE
    if (buffer[offset] !== ASN1_TAGS.SEQUENCE) {
      throw new Error('VarBindList tag inválido');
    }
    offset++;
    const { length: varbindListLength, lengthBytes: vbListLenBytes } = this.decodeLength(buffer, offset);
    offset += vbListLenBytes;

    const varbindsEnd = offset + varbindListLength;
    const varbinds: SnmpVarBind[] = [];

    while (offset < varbindsEnd && offset < buffer.length) {
      // Cada VarBind es una SEQUENCE
      if (buffer[offset] !== ASN1_TAGS.SEQUENCE) break;
      offset++;
      const { length: vbLen, lengthBytes: vbLenBytes } = this.decodeLength(buffer, offset);
      offset += vbLenBytes;
      const singleVbEnd = offset + vbLen;

      // OID
      if (buffer[offset] !== ASN1_TAGS.OBJECT_IDENTIFIER) {
        throw new Error('VarBind OID tag inválido');
      }
      const { value: oid, nextOffset: afterOid } = this.decodeOid(buffer, offset);
      offset = afterOid;

      // Valor
      const valTag = buffer[offset];
      let valType = 'UNKNOWN';
      let value: any = null;

      if (valTag === ASN1_TAGS.OCTET_STRING) {
        valType = 'OCTET_STRING';
        const res = this.decodeOctetString(buffer, offset);
        value = res.value;
        offset = res.nextOffset;
      } else if (valTag === ASN1_TAGS.INTEGER) {
        valType = 'INTEGER';
        const res = this.decodeInteger(buffer, offset);
        value = res.value;
        offset = res.nextOffset;
      } else if (valTag === ASN1_TAGS.TIMETICKS) {
        valType = 'TIMETICKS';
        const res = this.decodeInteger(buffer, offset); // TimeTicks se codifica como entero de 32 bits
        value = res.value;
        offset = res.nextOffset;
      } else if (valTag === ASN1_TAGS.COUNTER32 || valTag === ASN1_TAGS.GAUGE32) {
        valType = valTag === ASN1_TAGS.COUNTER32 ? 'COUNTER32' : 'GAUGE32';
        const res = this.decodeInteger(buffer, offset);
        value = res.value;
        offset = res.nextOffset;
      } else if (valTag === ASN1_TAGS.OBJECT_IDENTIFIER) {
        valType = 'OBJECT_IDENTIFIER';
        const res = this.decodeOid(buffer, offset);
        value = res.value;
        offset = res.nextOffset;
      } else if (valTag === ASN1_TAGS.IP_ADDRESS) {
        valType = 'IP_ADDRESS';
        offset++;
        const { length: ipLen, lengthBytes: ipLenBytes } = this.decodeLength(buffer, offset);
        offset += ipLenBytes;
        value = Array.from(buffer.slice(offset, offset + ipLen)).join('.');
        offset += ipLen;
      } else if (valTag === ASN1_TAGS.NULL) {
        valType = 'NULL';
        value = null;
        offset += 2;
      } else {
        // Tag no estándar o error
        valType = `TAG_0x${valTag.toString(16)}`;
        offset++;
        const { length: unkLen, lengthBytes: unkLenBytes } = this.decodeLength(buffer, offset);
        offset += unkLenBytes + unkLen;
        value = '[Binario]';
      }

      varbinds.push({ oid, type: valType, value });
      offset = singleVbEnd;
    }

    return {
      version,
      community,
      pduType,
      requestId,
      errorStatus,
      errorIndex,
      varbinds,
    };
  }

  // --- Codificadores Primitivos ASN.1 ---

  static encodeTlv(tag: number, content: Uint8Array): Uint8Array {
    const lenBuf = this.encodeLength(content.length);
    const result = new Uint8Array(1 + lenBuf.length + content.length);
    result[0] = tag;
    result.set(lenBuf, 1);
    result.set(content, 1 + lenBuf.length);
    return result;
  }

  static encodeSequence(content: Uint8Array): Uint8Array {
    return this.encodeTlv(ASN1_TAGS.SEQUENCE, content);
  }

  static encodeInteger(value: number): Uint8Array {
    if (value === 0) {
      return new Uint8Array([ASN1_TAGS.INTEGER, 0x01, 0x00]);
    }
    const bytes: number[] = [];
    let temp = value;
    while (temp > 0) {
      bytes.unshift(temp & 0xff);
      temp = Math.floor(temp / 256);
    }
    // Si el bit más significativo es 1, agregar un 0x00 para indicar signo positivo
    if ((bytes[0] & 0x80) !== 0) {
      bytes.unshift(0x00);
    }
    return this.encodeTlv(ASN1_TAGS.INTEGER, new Uint8Array(bytes));
  }

  static encodeOctetString(str: string): Uint8Array {
    const bytes = new TextEncoder().encode(str);
    return this.encodeTlv(ASN1_TAGS.OCTET_STRING, bytes);
  }

  static encodeOid(oidStr: string): Uint8Array {
    const parts = oidStr.split('.').map(Number);
    if (parts.length < 2) throw new Error('OID inválido: debe tener al menos 2 componentes');

    const bytes: number[] = [];
    // Primer byte combina los dos primeros números: (40 * X) + Y
    bytes.push(40 * parts[0] + parts[1]);

    for (let i = 2; i < parts.length; i++) {
      let val = parts[i];
      if (val < 128) {
        bytes.push(val);
      } else {
        // Codificación base 128 con bit 7 en 1 para bytes continuos
        const subBytes: number[] = [];
        subBytes.push(val & 0x7f);
        val = Math.floor(val / 128);
        while (val > 0) {
          subBytes.unshift((val & 0x7f) | 0x80);
          val = Math.floor(val / 128);
        }
        bytes.push(...subBytes);
      }
    }

    return this.encodeTlv(ASN1_TAGS.OBJECT_IDENTIFIER, new Uint8Array(bytes));
  }

  static encodeLength(length: number): Uint8Array {
    if (length < 128) {
      return new Uint8Array([length]);
    }
    const bytes: number[] = [];
    let temp = length;
    while (temp > 0) {
      bytes.unshift(temp & 0xff);
      temp = Math.floor(temp / 256);
    }
    return new Uint8Array([0x80 | bytes.length, ...bytes]);
  }

  // --- Decodificadores Primitivos ASN.1 ---

  static decodeLength(buffer: Uint8Array, offset: number): { length: number; lengthBytes: number } {
    const firstByte = buffer[offset];
    if ((firstByte & 0x80) === 0) {
      return { length: firstByte, lengthBytes: 1 };
    }
    const numBytes = firstByte & 0x7f;
    let length = 0;
    for (let i = 0; i < numBytes; i++) {
      length = length * 256 + buffer[offset + 1 + i];
    }
    return { length, lengthBytes: 1 + numBytes };
  }

  static decodeInteger(buffer: Uint8Array, offset: number): { value: number; nextOffset: number } {
    offset++; // saltar tag
    const { length, lengthBytes } = this.decodeLength(buffer, offset);
    offset += lengthBytes;
    let value = 0;
    for (let i = 0; i < length; i++) {
      value = value * 256 + buffer[offset + i];
    }
    return { value, nextOffset: offset + length };
  }

  static decodeOctetString(buffer: Uint8Array, offset: number): { value: string; nextOffset: number } {
    offset++; // saltar tag
    const { length, lengthBytes } = this.decodeLength(buffer, offset);
    offset += lengthBytes;
    const strBytes = buffer.slice(offset, offset + length);
    const value = new TextDecoder().decode(strBytes);
    return { value, nextOffset: offset + length };
  }

  static decodeOid(buffer: Uint8Array, offset: number): { value: string; nextOffset: number } {
    offset++; // saltar tag
    const { length, lengthBytes } = this.decodeLength(buffer, offset);
    offset += lengthBytes;
    const end = offset + length;

    const components: number[] = [];
    // Primer byte decodifica X e Y
    const first = buffer[offset];
    components.push(Math.floor(first / 40));
    components.push(first % 40);
    offset++;

    let currentVal = 0;
    while (offset < end) {
      const b = buffer[offset];
      offset++;
      currentVal = (currentVal << 7) | (b & 0x7f);
      if ((b & 0x80) === 0) {
        components.push(currentVal);
        currentVal = 0;
      }
    }

    return { value: components.join('.'), nextOffset: end };
  }

  static concatBuffers(buffers: Uint8Array[]): Uint8Array {
    const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const b of buffers) {
      result.set(b, offset);
      offset += b.length;
    }
    return result;
  }

  static bufferToHex(buffer: Uint8Array): string {
    return Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  }
}
