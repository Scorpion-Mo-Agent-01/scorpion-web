# AWS EC2 Access Setup for Scorpion Web

## Current Status

✅ **Application Running:** Docker container on port 3000  
✅ **Internal Access:** Working (http://localhost:3000)  
❌ **External Access:** Blocked (Security Group needs configuration)

## Your EC2 Details

- **Public IP:** `3.129.45.10`
- **Port:** `3000`
- **URL:** http://3.129.45.10:3000

## Issue: Security Group Configuration

The AWS Security Group is blocking external traffic on port 3000. You need to add an inbound rule.

## Solution: Add Security Group Rule

### Option 1: AWS Console (Web Interface)

1. **Navigate to EC2 Dashboard**
   - Go to https://console.aws.amazon.com/ec2/
   - Select "Instances" from left sidebar
   - Click on your running instance (`ip-172-31-14-178`)

2. **Open Security Group**
   - Scroll down to "Security" tab
   - Click on the Security Group name (looks like `sg-xxxxxxxxx`)

3. **Add Inbound Rule**
   - Click "Edit inbound rules"
   - Click "Add rule"
   - Configure:
     - **Type:** Custom TCP
     - **Port range:** 3000
     - **Source:** 
       - `0.0.0.0/0` (allow from anywhere) OR
       - `Your IP` (click this for automatic detection) OR
       - Specific CIDR block (e.g., `1.2.3.4/32` for single IP)
   - Click "Save rules"

4. **Test Access**
   - Open http://3.129.45.10:3000 in your browser
   - Should see the Scorpion landing page

### Option 2: AWS CLI (Command Line)

If you have AWS CLI configured on this EC2 instance or your local machine:

```bash
# Get security group ID
INSTANCE_ID=$(ec2-metadata --instance-id | cut -d' ' -f2)
SG_ID=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
  --output text)

# Add inbound rule for port 3000
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0
```

### Option 3: Terraform (Infrastructure as Code)

If using Terraform, add this to your security group:

```hcl
resource "aws_security_group_rule" "scorpion_web" {
  type              = "ingress"
  from_port         = 3000
  to_port           = 3000
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]  # Or restrict to your IP
  security_group_id = aws_security_group.your_sg.id
}
```

## Verification Steps

After adding the security group rule:

### 1. Test External Access
```bash
# From your local machine (not EC2)
curl http://3.129.45.10:3000
```

Expected output: HTML page with "SCORPION"

### 2. Test API
```bash
curl http://3.129.45.10:3000/api/tasks
```

Expected output: JSON array of tasks

### 3. Browser Test
Open in browser: http://3.129.45.10:3000

You should see:
- ✅ Scorpion landing page with dark theme
- ✅ "LOGIN" button in top right
- ✅ Hero section with scorpion logo

### 4. Dashboard Test
1. Click "LOGIN" or navigate to http://3.129.45.10:3000/dashboard
2. Login with:
   - Username: `MOYESH`
   - Password: `moyesh123`
3. You should see the Kanban board with 5 columns

## Troubleshooting

### Still can't access?

1. **Verify port binding:**
   ```bash
   # On EC2 instance
   sudo netstat -tlnp | grep 3000
   ```
   Should show: `0.0.0.0:3000` (not `127.0.0.1:3000`)

2. **Check Docker container:**
   ```bash
   docker ps | grep scorpion-web
   ```
   Status should be "Up"

3. **Check Docker logs:**
   ```bash
   docker logs scorpion-web
   ```
   Should show: "✓ Ready in XXms"

4. **Test from EC2 instance itself:**
   ```bash
   curl localhost:3000
   ```
   If this works but external doesn't, it's definitely the Security Group

5. **Check firewall (if applicable):**
   ```bash
   sudo iptables -L -n | grep 3000
   ```

### Security Group not showing the rule?

- Wait 30 seconds after adding rule (propagation delay)
- Hard refresh browser (Ctrl+Shift+R)
- Check you're editing the correct Security Group
- Verify the rule shows "0.0.0.0/0" for CIDR (or your specific IP)

## Security Considerations

### Production Recommendations:

1. **Restrict Source IP**
   Instead of `0.0.0.0/0`, use:
   - Your office IP: `1.2.3.4/32`
   - Your VPN range: `10.0.0.0/8`
   - Specific network: `192.168.1.0/24`

2. **Use HTTPS**
   - Set up SSL/TLS certificate
   - Use port 443 instead of 3000
   - Add reverse proxy (Nginx/Caddy)

3. **VPC Configuration**
   - Place in private subnet
   - Access via VPN or bastion host
   - Use Application Load Balancer for public access

4. **Additional Security**
   - Enable AWS WAF
   - Use CloudFront CDN
   - Implement rate limiting
   - Set up CloudWatch alarms

## Current Network Configuration

```
Internet
    │
    ▼
AWS Security Group (BLOCKING PORT 3000) ◄── FIX THIS
    │
    ▼
EC2 Instance (3.129.45.10)
    │
    ▼
Docker Port Mapping (0.0.0.0:3000 → 3000) ✅
    │
    ▼
Scorpion Web Container ✅
```

## Quick Reference

| Item | Value |
|------|-------|
| Public IP | `3.129.45.10` |
| Port | `3000` |
| Protocol | HTTP (TCP) |
| Container | `scorpion-web` (running) |
| Volume | `scorpion-web-data` |
| Username | `MOYESH` |
| Password | `moyesh123` |

## Next Steps

1. ✅ Add Security Group inbound rule for port 3000
2. ✅ Test external access: http://3.129.45.10:3000
3. ✅ Login to dashboard
4. ✅ Create a test task
5. ✅ Move task between columns
6. ⚠️ Plan production security hardening
7. ⚠️ Set up SSL/TLS for HTTPS
8. ⚠️ Replace hardcoded credentials
