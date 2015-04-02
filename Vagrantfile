Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.provision "ansible" do |ansible|
    ansible.playbook = "provisioning/playbook.yml"
    ansible.verbose = "vvvv"
    ansible.limit = "all"
    ansible.groups = {
      "vagrant" => ["default"],
      "web:children" => ["vagrant"]
    }
    ansible.extra_vars = {
      ssh_port: 22,
      vagrant: true,
      ansible_ssh_user: "vagrant",
      ansible_ssh_private_key_file: "~/.vagrant.d/insecure_private_key"
    }
  end
  config.vm.network :forwarded_port, host: 4567, guest: 80

end

