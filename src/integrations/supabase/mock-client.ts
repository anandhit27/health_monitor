
import { Database } from './types';

// Simple mock for local development when Supabase is unavailable
class MockSupabaseClient {
  private storage = localStorage;
  private currentSession: any = null;

  constructor() {
    const savedSession = this.storage.getItem('mock_session');
    if (savedSession) {
      this.currentSession = JSON.parse(savedSession);
    }
  }

  auth = {
    getSession: async () => ({ data: { session: this.currentSession }, error: null }),
    getUser: async () => ({ data: { user: this.currentSession?.user }, error: null }),
    signInWithPassword: async ({ email, password }: any) => {
      const users = JSON.parse(this.storage.getItem('mock_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (!user) {
        return { data: null, error: { message: 'Invalid login credentials' } };
      }

      this.currentSession = { user: { id: user.id, email: user.email }, access_token: 'mock-token' };
      this.storage.setItem('mock_session', JSON.stringify(this.currentSession));
      return { data: { user: this.currentSession.user, session: this.currentSession }, error: null };
    },
    signUp: async ({ email, password }: any) => {
      const users = JSON.parse(this.storage.getItem('mock_users') || '[]');
      if (users.find((u: any) => u.email === email)) {
        return { data: null, error: { message: 'User already exists' } };
      }
      const newUser = { id: Math.random().toString(36).substr(2, 9), email, password };
      users.push(newUser);
      this.storage.setItem('mock_users', JSON.stringify(users));
      
      this.currentSession = { user: { id: newUser.id, email: newUser.email }, access_token: 'mock-token' };
      this.storage.setItem('mock_session', JSON.stringify(this.currentSession));
      return { data: { user: this.currentSession.user, session: this.currentSession }, error: null };
    },
    signOut: async () => {
      this.currentSession = null;
      this.storage.removeItem('mock_session');
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  };

  from(table: keyof Database['public']['Tables']) {
    const self = this;
    const query = {
      _filters: [] as Array<(item: any) => boolean>,
      _order: null as { column: string, ascending: boolean } | null,
      _updateValues: null as any,
      
      select: function(columns: string = '*') {
        return this;
      },
      
      eq: function(column: string, value: any) {
        this._filters.push((item: any) => item[column] === value);
        return this;
      },

      in: function(column: string, values: any[]) {
        this._filters.push((item: any) => values.includes(item[column]));
        return this;
      },

      order: function(column: string, { ascending = true } = {}) {
        this._order = { column, ascending };
        return this;
      },
      
      single: async function() {
        const data = JSON.parse(self.storage.getItem(`mock_${table}`) || '[]');
        let filteredData = data;
        for (const filter of this._filters) {
          filteredData = filteredData.filter(filter);
        }
        const item = filteredData[0];
        return { data: item || null, error: item ? null : { message: 'Not found' } };
      },

      limit: function(n: number) {
        return this;
      },

      insert: async function(values: any) {
        const data = JSON.parse(self.storage.getItem(`mock_${table}`) || '[]');
        const newItems = Array.isArray(values) ? values : [values];
        const added = newItems.map(item => ({ 
          id: Math.random().toString(36).substr(2, 9), 
          created_at: new Date().toISOString(),
          ...item 
        }));
        data.push(...added);
        self.storage.setItem(`mock_${table}`, JSON.stringify(data));
        return { data: added, error: null };
      },

      update: function(values: any) {
        this._updateValues = values;
        return this;
      },

      then: async function(resolve: any) {
        const data = JSON.parse(self.storage.getItem(`mock_${table}`) || '[]');
        let filteredData = [...data];
        
        for (const filter of this._filters) {
          filteredData = filteredData.filter(filter);
        }

        if (this._order) {
          const { column, ascending } = this._order;
          filteredData.sort((a, b) => {
            if (a[column] < b[column]) return ascending ? -1 : 1;
            if (a[column] > b[column]) return ascending ? 1 : -1;
            return 0;
          });
        }
        
        if (this._updateValues) {
          const updatedData = data.map((item: any) => {
            let matches = true;
            for (const filter of this._filters) {
              if (!filter(item)) { matches = false; break; }
            }
            return matches ? { ...item, ...this._updateValues } : item;
          });
          self.storage.setItem(`mock_${table}`, JSON.stringify(updatedData));
          resolve({ data: null, error: null });
        } else {
          resolve({ data: filteredData, error: null });
        }
      }
    };
    return query;
  }
}

export const mockSupabase = new MockSupabaseClient();
