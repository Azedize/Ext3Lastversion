import os
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import binascii
import random
import string
import winreg
from typing import Optional
# =========================================
# 🔑 Paramètres cryptographie
# =========================================
PBKDF2_ITERATIONS = 100_000
SALT_LEN = 16
IV_LEN = 12
KEY_LEN = 32





def get_browser_path(browser_name_or_exe: str) -> Optional[str]:
    """Récupère le chemin d'un navigateur via le registre Windows"""
    exe_name = "chrome.exe"
    #print(f"🔍 Recherche de l'exécutable : {exe_name}")

    registry_paths = [
        (winreg.HKEY_LOCAL_MACHINE, winreg.KEY_READ | winreg.KEY_WOW64_32KEY),
        (winreg.HKEY_LOCAL_MACHINE, winreg.KEY_READ | winreg.KEY_WOW64_64KEY),
        (winreg.HKEY_CURRENT_USER, winreg.KEY_READ),
        (winreg.HKEY_LOCAL_MACHINE, winreg.KEY_READ),
    ]

    key_app_paths = rf"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\{exe_name}"

    for hive, access in registry_paths:
        try:
            with winreg.OpenKey(hive, key_app_paths, 0, access) as key_obj:
                path, _ = winreg.QueryValueEx(key_obj, None)
                if path and os.path.exists(path):
                    #print(f"✅ Navigateur trouvé : {path}")
                    return path
        except FileNotFoundError:
            print(f"Navigateur introuvable ({hive})")
            continue
        except Exception as e:
            print(f"Erreur registre ({hive}): {e}")
            # print(f"⚠️ Erreur registre ({hive}): {e}")

    #print(f"❌ Navigateur {exe_name} introuvable")
    return None

    

# 🔐 Génère un mot de passe sécurisé aléatoire pour Gmail avec au moins 12 caractères
def Generate_Gmail_Password(length=12):
    if length < 12:
        raise ValueError("The recommended minimum length for a secure password is 12 characters.")
    
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special_chars = "!@#$%^&*()-_+=<>?/|"

    password = [
        random.choice(lowercase),
        random.choice(uppercase),
        random.choice(digits),
        random.choice(special_chars),
    ]
    remaining_length = length - len(password)
    all_chars = lowercase + uppercase + digits + special_chars
    password += random.choices(all_chars, k=remaining_length)
    random.shuffle(password)
    return ''.join(password)





def generate_random_email():
    username = ''.join(random.choice(string.ascii_lowercase) for _ in range(random.randint(8, 15)))
    domain = random.choice(["gmail.com"])
    return f"{username}@{domain}"





def _derive_key(password: str, salt: bytes) -> bytes:
    if not isinstance(salt, (bytes, bytearray)):
        raise TypeError("salt must be bytes")
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=KEY_LEN,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    return kdf.derive(password.encode("utf-8"))





def encrypt_aes_gcm(password: str, plaintext: str) -> str:
    salt = os.urandom(SALT_LEN)
    key = _derive_key(password, salt)
    iv = os.urandom(IV_LEN)

    aesgcm = AESGCM(key)
    ct_and_tag = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)

    payload = salt + iv + ct_and_tag
    return binascii.hexlify(payload).decode("ascii")






def decrypt_aes_gcm(password: str, hex_payload: str) -> str:
    payload = binascii.unhexlify(hex_payload)
    if len(payload) < (SALT_LEN + IV_LEN + 16): 
        raise ValueError("Payload trop court / invalide")

    salt = payload[0:SALT_LEN]
    iv = payload[SALT_LEN:SALT_LEN + IV_LEN]
    ct_and_tag = payload[SALT_LEN + IV_LEN:]

    key = _derive_key(password, salt)
    aesgcm = AESGCM(key)
    plaintext_bytes = aesgcm.decrypt(iv, ct_and_tag, None)

    return plaintext_bytes.decode("utf-8")





def generate_chrome_cmd(url):
    chrome_path = get_browser_path("chrome")
    user_data = r'"C:\profil1"'
    
    cmd = (
        f'{chrome_path} '
        f'--user-data-dir={user_data} '
        f'--profile-directory=Default '
        f'--lang=en-US '
        f'--no-first-run '
        f'--url "{url}"'
    )

    return cmd

#Le programme is runing dans une interface de ligne de commande
# mon besoin continuer travaille sur cet parties 
# kkdd  bdv  bbvfxcfvdbnbh le programme is 

def example_usage():

    new_password = Generate_Gmail_Password(16)
    g = generate_random_email()
    # mot de passe/secret partagé pour dérivation de clé
    password = "A9!fP3z$wQ8@rX7kM2#dN6^bH1&yL4t*"

# email;passwordEmail;ipAddress;port;login;password;recoveryEmail
# catalinanietoum467@gmail.com;mVNjwHpQEvLU}@3;172.241.90.13;29842;lwaror;GKM4S6SK;hettlelooaciglen@mailforspam.com
    # combined = f"172.241.245.100;29842;lwaror;GKM4S6SK;bvfghfdfsdfghhjnbbvghfffhcf@gmail.com;4VBGF6ym1Z;ahmedramadan8513@gmail.com;{new_password};{g}"
    combined = f"172.241.90.13;29842;lwaror;GKM4S6SK;catalinanietoum467@gmail.com;mVNjwHpQEvLU}}@3;hettlelooaciglen@mailforspam.com;{new_password};{g}"
    # combined1 = f"45.146.118.39;29842;lwaror;GKM4S6SK;maiphuocduc5@gmail.com;OGKbOynrnu;maiphuocduc55445@hotmail.com;{new_password};__newRecovry__ "
    
    # print(f"🔑 Nouveau mot de passe générer {new_password}, {g}")
    encrypted_hex2 = encrypt_aes_gcm(password, combined)

    url2 =f"https://example.com/?rep={encrypted_hex2}"

    # print("🔗 URL 2 :", url2)

    command = generate_chrome_cmd(url2)
    print(" The Commande for Chrome is:", command)


if __name__ == "__main__":
    example_usage()


