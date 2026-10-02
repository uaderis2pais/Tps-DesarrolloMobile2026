package com.networkqos.telephony

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.CellInfo
import android.telephony.CellInfoGsm
import android.telephony.CellInfoLte
import android.telephony.CellInfoNr
import android.telephony.CellInfoWcdma
import android.telephony.CellSignalStrengthGsm
import android.telephony.CellSignalStrengthLte
import android.telephony.CellSignalStrengthNr
import android.telephony.CellSignalStrengthWcdma
import android.telephony.PhoneStateListener
import android.telephony.SignalStrength
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import androidx.annotation.RequiresApi
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * TelephonyModule: Módulo nativo propio en Kotlin para exponer métricas de telefonía celular:
 * - RSSI / RSRP / RSRQ en dBm
 * - Nivel de señal en barras (0 a 4)
 * - Nivel ASU
 * - Operador móvil (Carrier)
 * - Tipo de red celular (5G NR, 4G LTE, 3G HSPA, 2G GSM)
 * - Notificación reactiva de cambios de señal mediante eventos.
 */
class TelephonyModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val telephonyManager: TelephonyManager? =
        reactContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager

    private var phoneStateListener: PhoneStateListener? = null
    private var telephonyCallback: Any? = null // TelephonyCallback for Android 12+

    override fun getName(): String = "TelephonyModule"

    @ReactMethod
    fun getNetworkInfo(promise: Promise) {
        try {
            if (telephonyManager == null) {
                promise.reject("E_NO_TELEPHONY", "TelephonyManager no disponible en este dispositivo")
                return
            }

            val map = Arguments.createMap()

            // 1. Operador móvil y estado SIM
            val operatorName = telephonyManager.networkOperatorName.ifEmpty {
                telephonyManager.simOperatorName.ifEmpty { "Desconocido" }
            }
            map.putString("operator", operatorName)
            map.putBoolean("isRoaming", telephonyManager.isNetworkRoaming)
            map.putString("simState", getSimStateDescription(telephonyManager.simState))

            // 2. Tipo de red celular
            val networkType = resolveNetworkType()
            map.putString("networkType", networkType)

            // 3. Nivel de señal (RSSI, dBm, ASU y barras 0..4)
            var dbm = -100
            var level = 2
            var asu = 10
            var techDetails = "Standard"

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val signal = telephonyManager.signalStrength
                if (signal != null) {
                    level = signal.level
                    for (cellSignal in signal.cellSignalStrengths) {
                        dbm = cellSignal.dbm
                        asu = cellSignal.asuLevel
                        techDetails = cellSignal.javaClass.simpleName
                        break
                    }
                }
            } else {
                // Fallback para versiones previas a Android 10
                val fineLocationPerm = ContextCompat.checkSelfPermission(
                    reactContext,
                    Manifest.permission.ACCESS_FINE_LOCATION
                )
                if (fineLocationPerm == PackageManager.PERMISSION_GRANTED) {
                    val allCellInfo = telephonyManager.allCellInfo
                    if (!allCellInfo.isNullOrEmpty()) {
                        val cell = allCellInfo[0]
                        when (cell) {
                            is CellInfoLte -> {
                                dbm = cell.cellSignalStrength.dbm
                                level = cell.cellSignalStrength.level
                                asu = cell.cellSignalStrength.asuLevel
                                techDetails = "LTE"
                            }
                            is CellInfoWcdma -> {
                                dbm = cell.cellSignalStrength.dbm
                                level = cell.cellSignalStrength.level
                                asu = cell.cellSignalStrength.asuLevel
                                techDetails = "WCDMA"
                            }
                            is CellInfoGsm -> {
                                dbm = cell.cellSignalStrength.dbm
                                level = cell.cellSignalStrength.level
                                asu = cell.cellSignalStrength.asuLevel
                                techDetails = "GSM"
                            }
                        }
                    }
                }
            }

            map.putInt("dbm", dbm)
            map.putInt("level", level)
            map.putInt("asu", asu)
            map.putString("techDetails", techDetails)
            map.putDouble("timestamp", System.currentTimeMillis().toDouble())

            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("E_TELEPHONY_ERROR", "Error leyendo TelephonyManager: ${e.message}", e)
        }
    }

    @ReactMethod
    fun startSignalListening(promise: Promise) {
        try {
            if (telephonyManager == null) {
                promise.reject("E_NO_TELEPHONY", "TelephonyManager no disponible")
                return
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                registerTelephonyCallbackS()
            } else {
                registerLegacyPhoneStateListener()
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("E_LISTENER_ERROR", "Error iniciando listener de señal: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stopSignalListening(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && telephonyCallback != null) {
                telephonyManager?.unregisterTelephonyCallback(telephonyCallback as TelephonyCallback)
                telephonyCallback = null
            } else if (phoneStateListener != null) {
                telephonyManager?.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE)
                phoneStateListener = null
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("E_STOP_LISTENER_ERROR", e.message, e)
        }
    }

    private fun resolveNetworkType(): String {
        return try {
            val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                telephonyManager?.dataNetworkType ?: TelephonyManager.NETWORK_TYPE_UNKNOWN
            } else {
                @Suppress("DEPRECATION")
                telephonyManager?.networkType ?: TelephonyManager.NETWORK_TYPE_UNKNOWN
            }

            when (type) {
                TelephonyManager.NETWORK_TYPE_NR -> "5G NR"
                TelephonyManager.NETWORK_TYPE_LTE -> "4G LTE"
                TelephonyManager.NETWORK_TYPE_HSDPA,
                TelephonyManager.NETWORK_TYPE_HSUPA,
                TelephonyManager.NETWORK_TYPE_HSPA,
                TelephonyManager.NETWORK_TYPE_HSPAP,
                TelephonyManager.NETWORK_TYPE_UMTS -> "3G HSPA/UMTS"
                TelephonyManager.NETWORK_TYPE_EDGE,
                TelephonyManager.NETWORK_TYPE_GPRS -> "2G GSM/EDGE"
                TelephonyManager.NETWORK_TYPE_UNKNOWN -> "Desconocido (WiFi / Datos Inactivos)"
                else -> "Móvil ($type)"
            }
        } catch (e: SecurityException) {
            "Permiso Requerido (READ_PHONE_STATE)"
        }
    }

    private fun getSimStateDescription(state: Int): String {
        return when (state) {
            TelephonyManager.SIM_STATE_READY -> "Lista / Activa"
            TelephonyManager.SIM_STATE_ABSENT -> "Sin Tarjeta SIM"
            TelephonyManager.SIM_STATE_PIN_REQUIRED -> "PIN Requerido"
            TelephonyManager.SIM_STATE_PUK_REQUIRED -> "PUK Requerido"
            TelephonyManager.SIM_STATE_NETWORK_LOCKED -> "Bloqueada por Red"
            else -> "No Lista / Desconocido"
        }
    }

    private fun emitSignalUpdate(dbm: Int, level: Int) {
        val payload = Arguments.createMap().apply {
            putInt("dbm", dbm)
            putInt("level", level)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("onSignalStrengthChanged", payload)
    }

    @RequiresApi(Build.VERSION_CODES.S)
    private fun registerTelephonyCallbackS() {
        val callback = object : TelephonyCallback(), TelephonyCallback.SignalStrengthsListener {
            override fun onSignalStrengthsChanged(signalStrength: SignalStrength) {
                var dbm = -100
                var level = signalStrength.level
                for (cellSignal in signalStrength.cellSignalStrengths) {
                    dbm = cellSignal.dbm
                    break
                }
                emitSignalUpdate(dbm, level)
            }
        }
        telephonyCallback = callback
        reactContext.mainExecutor.execute {
            telephonyManager?.registerTelephonyCallback(reactContext.mainExecutor, callback)
        }
    }

    @Suppress("DEPRECATION")
    private fun registerLegacyPhoneStateListener() {
        phoneStateListener = object : PhoneStateListener() {
            override fun onSignalStrengthsChanged(signalStrength: SignalStrength?) {
                super.onSignalStrengthsChanged(signalStrength)
                if (signalStrength != null) {
                    val level = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        signalStrength.level
                    } else {
                        2
                    }
                    val dbm = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        signalStrength.cellSignalStrengths.firstOrNull()?.dbm ?: -100
                    } else {
                        -100
                    }
                    emitSignalUpdate(dbm, level)
                }
            }
        }
        telephonyManager?.listen(
            phoneStateListener,
            PhoneStateListener.LISTEN_SIGNAL_STRENGTHS
        )
    }
}
