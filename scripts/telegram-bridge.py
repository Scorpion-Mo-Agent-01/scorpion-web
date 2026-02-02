import json
import os
import time
import subprocess

# Path to the messages file
MESSAGES_PATH = "/home/scorpion/clawd/projects/scorpion-web/data/messages.json"
# Target user for Telegram
TARGET_ID = "5642534663"

def send_telegram_message(text):
    print(f"Forwarding to Telegram: {text}")
    # Use the clawdbot message tool via shell (or if we have a direct python api)
    # Since I'm an agent, I can just call the message tool directly if I were in the main loop.
    # But this script runs in the background. I'll use 'clawdbot message send' if available or just log it.
    
    # Actually, the 'message' tool is a clawdbot internal tool. 
    # I will use a simple system event or just rely on the main agent session to pick this up.
    
    # BETTER: I'll use the 'message' tool by echoing a command that the main gateway will see? 
    # No, I'll just use the message tool directly from this script using the provided tools if possible.
    # But I don't have a direct python library for it. 
    
    # I'll create a "signal" file that the main agent session will detect via HEARTBEAT.
    signal_path = "/home/scorpion/clawd/projects/scorpion-web/data/telegram_queue.jsonl"
    with open(signal_path, 'a') as f:
        f.write(json.dumps({"to": TARGET_ID, "message": text}) + "\n")

def main():
    print("Telegram Bridge Started. Monitoring for web messages...")
    while True:
        if os.path.exists(MESSAGES_PATH):
            try:
                with open(MESSAGES_PATH, 'r+') as f:
                    messages = json.load(f)
                    changed = False
                    for msg in messages:
                        if not msg.get('sent'):
                            # Format: "Web Message from [User]: [Content]"
                            formatted_text = f"🌐 *Web Portal Message*\nUser: {msg['username']}\nMessage: {msg['message']}"
                            send_telegram_message(formatted_text)
                            msg['sent'] = True
                            changed = True
                    
                    if changed:
                        f.seek(0)
                        json.dump(messages, f, indent=2)
                        f.truncate()
            except Exception as e:
                print(f"Error in bridge: {e}")
        
        time.sleep(5)

if __name__ == "__main__":
    main()
