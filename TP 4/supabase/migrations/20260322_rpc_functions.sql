-- ==============================================================================
-- AGROPULSE - FUNCIONES RPC Y TRIGGERS (TP 4)
-- ==============================================================================

-- Función RPC para emitir comandos de riego con idempotencia y validación atómica (RF-14, RF-16)
CREATE OR REPLACE FUNCTION issue_irrigation_command(
    p_valve_id UUID,
    p_action TEXT,
    p_duration_min INTEGER,
    p_client_request_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_org_id UUID;
    v_user_role TEXT;
    v_existing_id UUID;
    v_existing_status TEXT;
    v_has_pending BOOLEAN;
    v_new_command_id UUID;
BEGIN
    -- 1. Verificar idempotencia: Si el client_request_id ya fue recibido, retornar sin duplicar
    SELECT id, status INTO v_existing_id, v_existing_status
    FROM irrigation_commands
    WHERE client_request_id = p_client_request_id;

    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'idempotent', true,
            'command_id', v_existing_id,
            'status', v_existing_status,
            'message', 'Comando previamente registrado (idempotente)'
        );
    END IF;

    -- 2. Obtener organización y validar permisos del usuario autenticado
    SELECT p.organization_id INTO v_org_id
    FROM valves v
    JOIN plots p ON p.id = v.plot_id
    WHERE v.id = p_valve_id;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Válvula no encontrada o inaccesible';
    END IF;

    SELECT role INTO v_user_role
    FROM memberships
    WHERE user_id = auth.uid() AND organization_id = v_org_id;

    IF v_user_role IS NULL OR v_user_role NOT IN ('producer', 'operator') THEN
        RAISE EXCEPTION 'Permiso denegado: Solo productores y operadores pueden emitir comandos de riego';
    END IF;

    -- 3. RF-16: Verificar si ya existe un comando pendiente para esta válvula
    SELECT EXISTS (
        SELECT 1 FROM irrigation_commands
        WHERE valve_id = p_valve_id AND status = 'pending'
    ) INTO v_has_pending;

    IF v_has_pending THEN
        RAISE EXCEPTION 'Ya existe un comando en espera para esta válvula. Aguarde a que se aplique o cancele.';
    END IF;

    -- 4. Insertar el nuevo comando en estado 'pending'
    INSERT INTO irrigation_commands (
        valve_id,
        requested_by,
        action,
        duration_min,
        status,
        client_request_id,
        created_at
    ) VALUES (
        p_valve_id,
        auth.uid(),
        p_action,
        p_duration_min,
        'pending',
        p_client_request_id,
        NOW()
    ) RETURNING id INTO v_new_command_id;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'command_id', v_new_command_id,
        'status', 'pending',
        'message', 'Comando de irrigación encolado correctamente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
