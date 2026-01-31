# RadioManagement app
## How is it created
App is created with next js and convex. Convex is responsible for backend, database and auth.
## Player
This application is web-based management tool for RadioPlayer, my another app.
## How to deploy
  1. Configure dns for api, @, action, dashboard  with records A for your server IP
  2. Configure proxy example with nginx:
     

    server {
        server_name api.your-domain;
    
        location / {
            proxy_pass http://127.0.0.1:3210;
    
            # WebSocket (Convex sync)
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
    
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    server {
        server_name your-domain;
    
        location / {
            proxy_pass http://127.0.0.1:3000;
    
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    server {
        server_name action.your-domain;
    
        location / {
            proxy_pass http://127.0.0.1:3211;
    
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    server {
        server_name dashboard.your-domain;
    
        location / {
            proxy_pass http://127.0.0.1:6791;
    
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    
  3. Remember to open 80 and 443(http and https) on firewall
  4. Run certbot to generate ssl for all domains
  5. Download production branch that includes all needed files
  6. Create .env file that looks like this:
  ```
  CONVEX_CLOUD_ORIGIN=https://api.your-domain
  CONVEX_SITE_ORIGIN=https://action.your-domain
  NEXT_PUBLIC_DEPLOYMENT_URL=https://api.your-domain
  
  NEXT_PUBLIC_CONVEX_URL=https://api.your-domain
  
  CONVEX_SELF_HOSTED_URL=https://api.your-domain
  CONVEX_SELF_HOSTED_ADMIN_KEY=will be used later
  ```
  7. Run docker compose build  -- to build frontend app
  8. Run docker compose up -d
  9. Run docker compose exec backend ./generate_admin_key.sh and copy output, put this in .env in CONVEX_SELF_HOSTED_ADMIN_KEY
  10. Run npx convex deploy -- you may need to install nodejs and npm
  11. Open dashboard.your-domain and log in with previously generated admin key
  12. Run node generateKeys.mjs and copy output then paste it in convex dasboard settings -> environmental variables -> Add
  13. You may want to run docker compose restart -d or event docker compose down and then up -d to be sure
