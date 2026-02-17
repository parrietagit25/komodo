import { createContext, useContext, useReducer, useCallback } from 'react'

const CartContext = createContext(null)

const initialState = { standId: null, standName: null, items: [] }

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { standId, standName, product } = action.payload
      const { id: productId, name, price, stock_quantity } = product
      const unitPrice = typeof price === 'string' ? parseFloat(price) : Number(price)
      const qty = Math.min(action.payload.quantity ?? 1, Math.max(0, Number(stock_quantity) || 1))

      if (state.standId !== null && state.standId !== standId) {
        return {
          standId,
          standName: standName ?? state.standName,
          items: [{ productId, name, price: unitPrice, quantity: qty, unit_price: unitPrice }],
        }
      }
      const existing = state.items.find((i) => i.productId === productId)
      let items
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, Math.max(0, Number(stock_quantity) || 999))
        items = state.items.map((i) =>
          i.productId === productId ? { ...i, quantity: newQty, unit_price: unitPrice } : i
        ).filter((i) => i.quantity > 0)
      } else {
        items = [...state.items, { productId, name, price: unitPrice, quantity: qty, unit_price: unitPrice }]
      }
      return {
        standId: standId ?? state.standId,
        standName: standName ?? state.standName,
        items,
      }
    }
    case 'SET_QUANTITY': {
      const { productId, quantity } = action.payload
      const qty = Math.max(0, Number(quantity) || 0)
      const items = state.items
        .map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
        .filter((i) => i.quantity > 0)
      return { ...state, items }
    }
    case 'REMOVE_ITEM': {
      const items = state.items.filter((i) => i.productId !== action.payload.productId)
      return items.length === 0
        ? { standId: null, standName: null, items: [] }
        : { ...state, items }
    }
    case 'CLEAR_CART':
      return initialState
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  const addItem = useCallback((standId, standName, product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { standId, standName, product, quantity } })
  }, [])

  const setQuantity = useCallback((productId, quantity) => {
    dispatch({ type: 'SET_QUANTITY', payload: { productId, quantity } })
  }, [])

  const removeItem = useCallback((productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
  }, [])

  const totalAmount = state.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
  const itemCount = state.items.reduce((n, i) => n + i.quantity, 0)

  const value = {
    standId: state.standId,
    standName: state.standName,
    items: state.items,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    totalAmount,
    itemCount,
    isEmpty: state.items.length === 0,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
