import { reactive, type Ref, ref } from 'vue'

type FormValues = Record<string, unknown>

type FormErrors<TValues> = Partial<Record<keyof TValues, string>>

type Validators<TValues extends FormValues> = {
  [Field in keyof TValues]?: (value: TValues[Field], values: TValues) => string | undefined
}

type UseFormOptions<TValues extends FormValues> = {
  initialState: TValues
  validators?: Validators<TValues>
}

export const useForm = <TValues extends FormValues>({
  initialState,
  validators = {},
}: UseFormOptions<TValues>) => {
  const state = reactive({ ...initialState }) as unknown as TValues
  const errors = ref({}) as Ref<FormErrors<TValues>>

  const setError = <Field extends keyof TValues>(field: Field, message: string) => {
    errors.value = {
      ...errors.value,
      [field]: message,
    }
  }

  const clearError = <Field extends keyof TValues>(field: Field) => {
    const nextErrors: FormErrors<TValues> = {
      ...errors.value,
    }

    delete nextErrors[field]

    errors.value = nextErrors
  }

  const validateField = <Field extends keyof TValues>(field: Field) => {
    const validator = validators[field]

    if (!validator) {
      clearError(field)
      return true
    }

    const message = validator(state[field], state)

    if (message) {
      setError(field, message)
      return false
    }

    clearError(field)
    return true
  }

  const validate = () => {
    return (Object.keys(validators) as Array<keyof TValues>).map(validateField).every(Boolean)
  }

  const reset = () => {
    Object.assign(state, initialState)
    errors.value = {}
  }

  const handleSubmit = (callback: (values: TValues) => void) => {
    return () => {
      if (!validate()) return

      callback({ ...state } as TValues)
    }
  }

  return { state, errors, validate, validateField, handleSubmit, reset }
}
